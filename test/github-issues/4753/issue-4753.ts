import { expect } from "chai"
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
    const dataSources: DataSource[] = []
    after(() => closeTestingConnections(dataSources))

    it("should connect without error when using replication", async () => {
        const connectionOptions: MysqlConnectionOptions | undefined =
            getTypeOrmConfig()
                .filter((v) => !v.skip)
                .find(isMySql)

        if (!connectionOptions) {
            // Skip if MySQL tests aren't enabled at all
            return
        }

        const { host, username, password, database, ...restConfig } =
            connectionOptions
        const dataSource = new DataSource({
            ...restConfig,
            replication: {
                master: { host, username, password, database },
                slaves: [{ host, username, password, database }],
            },
            entities: [User],
        })
        dataSources.push(dataSource)

        await dataSource.initialize()
        expect(dataSource.isInitialized).to.equal(true)
    })
})
