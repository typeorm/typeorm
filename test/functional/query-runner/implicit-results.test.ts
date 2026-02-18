import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"

describe("query runner > implicit results", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [
                __dirname + "/view/*{.js,.ts}",
                __dirname + "/entity/:driver:/*{.js,.ts}",
            ],
            enabledDrivers: ["oracle"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should return results for Oracle Stored Procedure with Implicit Results", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Create sample procedure with implicit results
                await connection.query(`
          CREATE OR REPLACE PROCEDURE TEST_IMPLICIT_RESULTS
          AS
            test_array dbms_sql.varchar2_table;
            cur1 sys_refcursor;
          BEGIN
            test_array(1) := 'First';
            test_array(2) := 'Second';
            test_array(3) := 'Third';
            OPEN cur1 FOR SELECT * FROM TABLE(test_array);
            DBMS_SQL.return_result(cur1);
          END;
        `)

                const result = await queryRunner.query(`
          BEGIN
            TEST_IMPLICIT_RESULTS;
          END;
        `)

                expect(result).to.be.an("array")
                expect(result).to.eql([
                    [
                        { COLUMN_VALUE: "First" },
                        { COLUMN_VALUE: "Second" },
                        { COLUMN_VALUE: "Third" },
                    ],
                ])

                await queryRunner.release()
            }),
        ))
})
