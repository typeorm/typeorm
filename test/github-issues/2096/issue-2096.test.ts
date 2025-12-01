import { expect } from "chai"
import { DataSource } from "../../../src"
import { MysqlConnectionOptions } from "../../../src/driver/mysql/MysqlConnectionOptions"
import { getTypeOrmConfig } from "../../utils/test-utils"

describe("github issues > #2096 [mysql] Database name isn't read from url", () => {
    it("should be possible to define a database by connection url for mysql", async () => {
        const config = getTypeOrmConfig()

        // it is important to synchronize here, to trigger EntityMetadataValidator.validate
        // that previously threw the error where the database on the driver object was undefined
        const mysqlConfig = config.find(
            (c) => c.name === "mysql" && !c.skip,
        ) as MysqlConnectionOptions

        if (!mysqlConfig) {
            return
        }

        const { username, password, host, port, database, ...restConfig } =
            mysqlConfig

        const url = `mysql://${username}:${password}@${host}:${port}/${database}`

        const dataSource = new DataSource({
            ...restConfig,
            name: "#2096",
            url,
            entities: [__dirname + "/entity/*{.js,.ts}"],
            synchronize: true,
            type: "mysql",
        })
        await dataSource.initialize()
        expect(dataSource.isInitialized).to.equal(true)
        await dataSource.destroy()
    })
})
