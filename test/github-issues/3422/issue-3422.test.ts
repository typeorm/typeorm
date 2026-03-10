import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #3422 cannot save to nested-tree table if schema is used in postgres", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should not fail when using schema and nested-tree", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.query("CREATE SCHEMA IF NOT EXISTS admin")
                await connection.synchronize()
                const parent = new User()
                await connection.manager.save(parent)
                const child = new User()
                child.manager = parent
                await connection.manager.save(child)

                const user = await connection.manager
                    .getRepository(User)
                    .findOne({
                        where: {
                            id: child.id,
                        },
                        relations: {
                            manager: true,
                        },
                    })
                user!.id.should.be.equal(child.id)
                user!.manager.id.should.be.equal(parent.id)
            }),
        ))
})
