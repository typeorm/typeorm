import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Bar } from "./entity/Bar"
import { Foo } from "./entity/Foo"

describe("cascades > save with shared primary key", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            // SQLite does not support AUTOINCREMENT on composite primary keys
            enabledDrivers: [
                "mysql",
                "mariadb",
                "postgres",
                "cockroachdb",
                "mssql",
                "oracle",
                "sap",
                "spanner",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("save an entity having a child entity with shared PK and CreatedDateColumn by cascade", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const foo = new Foo()
                foo.text = "This is a feature post"

                await connection.manager.save(
                    connection.getRepository(Bar).create({
                        title: "Feature Post",
                        foo,
                    }),
                )
            }),
        ))
})
