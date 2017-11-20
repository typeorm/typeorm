import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

describe("github issues > #945 synchronization with multiple primary keys", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("schema should include two primary keys", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.getTable("test_entity");

        if (tableSchema) {
            const firstId = tableSchema.primaryKeys.find(column => {
                return column.columnName === "id1";
            });
            const secondId = tableSchema.primaryKeys.find(column => {
                return column.columnName === "id2";
            });

            expect(tableSchema.primaryKeys).length(2);
            expect(firstId).not.to.be.undefined;
            expect(secondId).not.to.be.undefined;
        }
        
        await queryRunner.release();
    })));

});
