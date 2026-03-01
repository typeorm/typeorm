import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource, TypeORMError } from "../../../../src"
import { Parent } from "./entity/Parent"
import { Child } from "./entity/Child"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("repository > clear cascade", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("clear with cascade true", () => {
        it("truncates dependent tables", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    // Testing only for non-oracle drivers here
                    if (dataSource.driver.options.type === "oracle") return

                    const parentRepo = dataSource.getRepository(Parent)
                    const childRepo = dataSource.getRepository(Child)

                    const parent = await parentRepo.save({ name: "p1" })
                    await childRepo.save({ value: "c1", parent })

                    let parentCount = await parentRepo.count()
                    let childCount = await childRepo.count()
                    expect(parentCount).to.equal(1)
                    expect(childCount).to.equal(1)

                    if (!DriverUtils.isPostgresFamily(dataSource.driver)) {
                        await expect(
                            parentRepo.clear({ cascade: true }),
                        ).to.be.rejectedWith(
                            TypeORMError,
                            /does not support clearing table with cascade option/,
                        )
                        return
                    }
                    await parentRepo.clear({ cascade: true })

                    parentCount = await parentRepo.count()
                    childCount = await childRepo.count()
                    expect(parentCount).to.equal(0)
                    expect(childCount).to.equal(0)
                }),
            ))
    })

    describe("clear with cascade false", () => {
        it("fails with dependent tables", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "oracle") return

                    const parentRepo = dataSource.getRepository(Parent)
                    const childRepo = dataSource.getRepository(Child)

                    const parent = await parentRepo.save({ name: "p1" })
                    await childRepo.save({ value: "c1", parent })

                    const parentCount = await parentRepo.count()
                    const childCount = await childRepo.count()
                    expect(parentCount).to.equal(1)
                    expect(childCount).to.equal(1)

                    await expect(parentRepo.clear({ cascade: false })).to.be
                        .rejected
                }),
            ))

        it("truncates independent table", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    if (dataSource.driver.options.type === "oracle") return

                    const childRepo = dataSource.getRepository(Child)

                    await childRepo.save({ value: "c1" })

                    const childCount = await childRepo.count()
                    expect(childCount).to.equal(1)

                    await childRepo.clear({ cascade: false })

                    const newChildCount = await childRepo.count()
                    expect(newChildCount).to.equal(0)
                }),
            ))
    })
})
