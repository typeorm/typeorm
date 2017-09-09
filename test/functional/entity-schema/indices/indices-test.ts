import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";
 
import {PersonSchema} from "./entity/Person";

describe("indices > reading index from entity schema and updating database", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entitySchemas: [<any>PersonSchema],
        schemaCreate: true,
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("create index", function() {

        it("should work without errors", () => Promise.all(connections.map(async connection => {

            const queryRunner = connection.createQueryRunner();
            const tableSchema = await queryRunner.loadTableSchema("person");
            await queryRunner.release();

            expect(tableSchema!.indices.length).to.be.equal(1);
            expect(tableSchema!.indices[0].name).to.be.equal("IDX_UNQ_Person"); 
                
        })));

    });

});
