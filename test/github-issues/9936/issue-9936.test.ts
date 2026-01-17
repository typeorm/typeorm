import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"
import { Classification } from "./entity/classification"

describe("github issues > #9936 relationLoadStrategy query: ER_NONUNIQ_TABLE during recursive call", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                logging: false,
                relationLoadStrategy: "query",
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should save and load parent of child", async () =>
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager
                const parent = new Classification()
                await manager.save(parent)
                expect(parent.id).not.to.be.undefined

                const child = new Classification()
                child.parent = parent
                await manager.save(child)
                expect(child.id).not.to.be.undefined
                expect(child.parent.id).to.equal(parent.id)

                const loadedChild = await manager.findOne(Classification, {
                    where: {
                        id: child.id,
                    },
                    relations: { parent: true },
                })
                expect(loadedChild?.parent?.id).not.to.be.undefined
                expect(loadedChild!.parent!.id.toLowerCase()).to.equal(
                    parent.id.toLowerCase(),
                )
            }),
        ))
})
