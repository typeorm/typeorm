import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"
import { ChildNoDelete } from "./entity/ChildNoDelete"
import { xfail } from "../../../../utils/xfail"

describe("repository > clear cascade (oracle)", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["oracle"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("clear({ cascade: true }) truncates dependent tables with onDelete: CASCADE", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parentRepo = dataSource.getRepository(Parent)
                const childRepo = dataSource.getRepository(Child)

                const parent = await parentRepo.save({ name: "p1" })
                await childRepo.save({ value: "c1", parent })

                let parentCount = await parentRepo.count()
                let childCount = await childRepo.count()
                expect(parentCount).to.equal(1)
                expect(childCount).to.equal(1)

                await parentRepo.clear({ cascade: true })

                parentCount = await parentRepo.count()
                childCount = await childRepo.count()
                expect(parentCount).to.equal(0)
                expect(childCount).to.equal(0, "children should be cascaded")
            }),
        ))

    xfail.it(
        "clear({ cascade: true }) does not truncate children without onDelete: CASCADE",
        () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const parentRepo = dataSource.getRepository(Parent)
                    const childNoDeleteRepo =
                        dataSource.getRepository(ChildNoDelete)

                    const parent = await parentRepo.save({ name: "p2" })
                    await childNoDeleteRepo.save({ value: "c2", parent })

                    const parentCount = await parentRepo.count()
                    const childNoDeleteCount = await childNoDeleteRepo.count()
                    expect(parentCount).to.equal(1)
                    expect(childNoDeleteCount).to.equal(1)

                    // Oracle throws ORA-14705 when trying to TRUNCATE CASCADE
                    // a table with foreign keys that don't have ON DELETE CASCADE
                    try {
                        await parentRepo.clear({ cascade: true })
                    } catch (error) {
                        expect.fail(
                            `Oracle TRUNCATE CASCADE should throw when a table with foreign keys that don't have ON DELETE CASCADE
                            error: ${(error as any).message}`,
                        )
                    }
                }),
            ),
    )
})
