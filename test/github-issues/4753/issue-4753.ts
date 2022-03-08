import { getConnectionManager } from "../../../src"
import { DataSource } from "../../../src/data-source/DataSource"
import { closeTestingConnections } from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #4753 MySQL Replication Config broken", () => {
    let connections: DataSource[] = []
    after(() => closeTestingConnections(connections))

    it("should connect without error when using replication", async () => {
        const connection = getConnectionManager().create({
            type: "mysql",
            replication: {
                master: {
                    username: "test",
                    password: "test",
                    database: "test",
                },
                slaves: [
                    {
                        username: "test",
                        password: "test",
                        database: "test",
                    },
                ],
            },
            entities: [User],
        })
        connections.push(connection)
        await connection.connect()
        connection.isInitialized.should.be.true
    })
})
