import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { VirtualUser } from "./entity/virtual-user"

describe.only("github issues > #10839 SQL Error from Trailing Line Break in VirtualColumn Query String", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should generate correctly SQL command with Trailing Line Break in VirtualColumn", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const virtualUser = dataSource.manager.create(VirtualUser, {})
                await dataSource.manager.save(virtualUser)

                const virtualColumnUser =
                    await dataSource.manager.findOneOrFail(VirtualUser, {
                        select: {
                            age: true,
                        },
                        where: {
                            age: virtualUser.id,
                        },
                    })

                console.log(virtualColumnUser)
                expect(virtualColumnUser.age).to.be.exist
            }),
        ))

    // you can add additional tests if needed
})
