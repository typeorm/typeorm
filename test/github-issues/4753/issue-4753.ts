import { getConnectionManager } from "../../../src"
import { DataSource } from "../../../src/data-source/DataSource"
import { MysqlConnectionOptions } from "../../../src/driver/mysql/MysqlConnectionOptions"
import {
    closeTestingConnections,
    getTypeOrmConfig,
    TestingConnectionOptions,
} from "../../utils/test-utils"
import { User } from "./entity/User"

function isMySql(v: TestingConnectionOptions): v is MysqlConnectionOptions {
    return v.type === "mysql"
}

describe("github issues > #4753 MySQL Replication Config broken", () => {
    let connections: DataSource[] = []
    after(() => closeTestingConnections(connections))

    it("should connect without error when using replication", async () => {
        const connectionOptions: MysqlConnectionOptions | undefined =
            getTypeOrmConfig()
                .filter((v) => !v.skip)
                .find(isMySql)

        if (!connectionOptions) {
            // Skip if MySQL tests aren't enabled at all
            return
        }
        const connectionManager = getConnectionManager()
        const connection = connectionManager.create({
            type: "mysql",
            replication: {
                master: {
                    host: connectionOptions.host,
                    username: connectionOptions.username,
                    password: connectionOptions.password,
                    database: connectionOptions.database,
                },
                slaves: [
                    {
                        host: connectionOptions.host,
                        username: connectionOptions.username,
                        password: connectionOptions.password,
                        database: connectionOptions.database,
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
