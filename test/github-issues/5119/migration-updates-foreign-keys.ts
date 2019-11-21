import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    setupSingleTestingConnection
} from "../../utils/test-utils";
import { Connection, createConnection } from "../../../src";
import { fail } from "assert";

describe("migration with foreign key that changes target", () => {
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

    it("should generate a drop and create step", async () => {
        // v2Connections = await createTestingConnections({
        //     entities: [__dirname + "/entity/v2/*{.js,.ts}"],
        //     enabledDrivers: ["postgres"],
        //     logging: true,
        //     dropSchema: false,
        //     schemaCreate: false
        // });
        console.log(`connections length: ${connections.length}`);
        return Promise.all(
            connections.map(async function(_connection) {
                console.log("creating options");
                const options = setupSingleTestingConnection(
                    _connection.options.type,
                    {
                        name: `${_connection.name}-v2`,
                        entities: [__dirname + "/entity/v2/*{.js,.ts}"],
                        logging: true,
                        dropSchema: false,
                        schemaCreate: false
                    }
                );
                console.log("created options");
                if (!options) {
                    fail();
                    return Promise.resolve();
                }
                console.log("creating connection");
                const connection = await createConnection(options);
                console.log("created connection");
                try {
                    console.log("in test");
                    const sqlInMemory = await connection.driver
                        .createSchemaBuilder()
                        .log();
                    console.log("UP:");
                    console.log(sqlInMemory.upQueries);
                    console.log("DOWN:");
                    console.log(sqlInMemory.downQueries);

                    const downQueries = sqlInMemory.downQueries.map(
                        query => query.query
                    );
                    const upQueries = sqlInMemory.downQueries.map(
                        query => query.query
                    );

                    upQueries.should.equal([
                        `CREATE TABLE "account" ("id" SERIAL NOT NULL, "userId" integer, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`,
                        `ALTER TABLE "account" ADD CONSTRAINT "FK_60328bf27019ff5498c4b977421" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
                        `TODO alter table to drop FK from post to user`,
                        `TODO alter tale to create FK from post to account`
                    ]);

                    downQueries.should.equal([
                        `DROP TABLE "account"`,
                        `ALTER TABLE "account" DROP CONSTRAINT "FK_60328bf27019ff5498c4b977421"`,
                        `TODO alter table to drop FK from post to account`,
                        `TODO alter table to create FK from post to user`
                    ]);
                } finally {
                    connection.close();
                }
            })
        );
    });
});
