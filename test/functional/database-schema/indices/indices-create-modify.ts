import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";
import {EntityMetadata} from "../../../../src/metadata/EntityMetadata";
import {IndexMetadata} from "../../../../src/metadata/IndexMetadata";
 
import {Person} from "./entity/Person";

describe("indices > reading index from entity schema and updating database", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Person],
        schemaCreate: true,
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("create index", function() {

        it("should work without errors", () => Promise.all(connections.map(async connection => {

            const checkCreateFn = async function() {

                const queryRunner = connection.createQueryRunner();
                const tableSchema = await queryRunner.loadTableSchema("person");
                await queryRunner.release();
    
                expect(tableSchema!.indices.length).to.be.equal(1);
                expect(tableSchema!.indices[0].name).to.be.equal("IDX_TEST"); 
                expect(tableSchema!.indices[0].isUnique).to.be.false; 
                expect(tableSchema!.indices[0].columnNames.length).to.be.equal(2); 
                expect(tableSchema!.indices[0].columnNames[0]).to.be.equal("firstname"); 
                expect(tableSchema!.indices[0].columnNames[1]).to.be.equal("lastname");
    
            };

            const checkUniquenessFn = async function () {

                const queryRunner = connection.createQueryRunner();
                const tableSchema = await queryRunner.loadTableSchema("person");
                await queryRunner.release();
    
                expect(tableSchema!.indices.length).to.be.equal(1);
                expect(tableSchema!.indices[0].name).to.be.equal("IDX_TEST"); 
                expect(tableSchema!.indices[0].isUnique).to.be.true; 
                expect(tableSchema!.indices[0].columnNames.length).to.be.equal(2); 
                expect(tableSchema!.indices[0].columnNames[0]).to.be.equal("firstname"); 
                expect(tableSchema!.indices[0].columnNames[1]).to.be.equal("lastname");

            };

            const checkColumnChangeFn = async function () {

                const queryRunner = connection.createQueryRunner();
                const tableSchema = await queryRunner.loadTableSchema("person");
                await queryRunner.release();
    
                expect(tableSchema!.indices.length).to.be.equal(1);
                expect(tableSchema!.indices[0].name).to.be.equal("IDX_TEST"); 
                expect(tableSchema!.indices[0].isUnique).to.be.false; 
                expect(tableSchema!.indices[0].columnNames.length).to.be.equal(2); 
                expect(tableSchema!.indices[0].columnNames[0]).to.be.equal("lastname");
                expect(tableSchema!.indices[0].columnNames[1]).to.be.equal("firstname"); 

            };
            await checkCreateFn();
        
            const entityMetadata1 = connection.entityMetadatas.find(x => x.name === "Person");
            const indexMetadata1 = entityMetadata1!.indices.find(x => x.name === "IDX_TEST");
            indexMetadata1!.isUnique = true;

            await connection.synchronize(false);
            await checkUniquenessFn();
            
            const entityMetadata2 = connection.entityMetadatas.find(x => x.name === "Person");
            entityMetadata2!.indices = [new IndexMetadata({
                entityMetadata: <EntityMetadata>entityMetadata2,
                args: {
                    target: Person,
                    name: "IDX_TEST",
                    columns: ["lastname", "firstname"],
                    unique: false
                }
            })];
            entityMetadata2!.indices.forEach(index => index.build(connection.namingStrategy));

            await connection.synchronize(false);
            await checkColumnChangeFn();

        })));

    });

});
