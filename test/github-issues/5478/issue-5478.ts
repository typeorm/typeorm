import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    setupSingleTestingConnection
} from "../../utils/test-utils";
import { Connection, createConnection } from "../../../src";
import { fail } from "assert";

describe.only("github issues > #5478 Setting enumName doesn't change how migrations get generated", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/v1/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
                logging: true
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections([...connections]));

    it("should generate an altered column type", async () => {
        return Promise.all(
            connections.map(async function(_connection) {
                if (_connection.options.type !== "postgres") {
                    return;
                }
                const options = setupSingleTestingConnection(
                    _connection.options.type,
                    {
                        name: `${_connection.name}-v2`,
                        entities: [__dirname + "/entity/v2/*{.js,.ts}"],
                        dropSchema: false,
                        schemaCreate: false
                    }
                );
                if (!options) {
                    fail();
                    return;
                }
                const connection = await createConnection(options);
                try {
                    const sqlInMemory = await connection.driver
                        .createSchemaBuilder()
                        .log();

                    const upQueries = sqlInMemory.upQueries.map(
                        query => query.query
                    );
                    const downQueries = sqlInMemory.downQueries.map(
                        query => query.query
                    );
                    console.log("UP:", upQueries)
                    console.log("DOWN:", downQueries)
                    fail();
                    // upQueries.should.eql([
                    //     'ALTER TYPE "public"."UserRoleEnum" RENAME TO "user_usertype_enum_old"',
                    //     `CREATE TYPE "user_usertype_enum" AS ENUM('0', '1')`,
                    //     'ALTER TABLE "user" ALTER COLUMN "userType" TYPE "user_usertype_enum" USING "userType"::"text"::"user_usertype_enum"',
                    //     'DROP TYPE "user_usertype_enum_old"'
                    // ]);
                    // downQueries.should.eql([
                    //     'ALTER TYPE "user_usertype_enum_old" RENAME TO  "UserRoleEnum"',
                    //     'DROP TYPE "user_usertype_enum"',
                    //     'ALTER TABLE "user" ALTER COLUMN "userType" TYPE "user_usertype_enum_old" USING "userType"::"text"::"user_usertype_enum_old"',
                    //     'CREATE TYPE "user_usertype_enum_old" AS ENUM()'
                    // ]);
                } finally {
                    connection.close();
                }
            })
        );
    });
});
