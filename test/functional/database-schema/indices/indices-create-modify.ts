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

        it("should create a non unique index with 2 columns", () => Promise.all(connections.map(async connection => {

            const queryRunner = connection.createQueryRunner();
            const table = await queryRunner.getTable("person");
            await queryRunner.release();

            expect(table!.indices.length).to.be.equal(1);
            expect(table!.indices[0].name).to.be.equal("IDX_TEST"); 
            expect(table!.indices[0].isUnique).to.be.false; 
            expect(table!.indices[0].columnNames.length).to.be.equal(2); 
            expect(table!.indices[0].columnNames[0]).to.be.equal("firstname"); 
            expect(table!.indices[0].columnNames[1]).to.be.equal("lastname");

        })));
            
        it("should update the index to be unique", () => Promise.all(connections.map(async connection => {
            
            const entityMetadata = connection.entityMetadatas.find(x => x.name === "Person");
            const indexMetadata = entityMetadata!.indices.find(x => x.name === "IDX_TEST");
            indexMetadata!.isUnique = true;

            await connection.synchronize(false);

            const queryRunner = connection.createQueryRunner();
            const table = await queryRunner.getTable("person");
            await queryRunner.release();

            expect(table!.indices.length).to.be.equal(1);
            expect(table!.indices[0].name).to.be.equal("IDX_TEST"); 
            expect(table!.indices[0].isUnique).to.be.true; 
            expect(table!.indices[0].columnNames.length).to.be.equal(2); 
            expect(table!.indices[0].columnNames[0]).to.be.equal("firstname"); 
            expect(table!.indices[0].columnNames[1]).to.be.equal("lastname");

        })));

        it("should update the index swaping the 2 columns", () => Promise.all(connections.map(async connection => {
            
            const entityMetadata = connection.entityMetadatas.find(x => x.name === "Person");
            entityMetadata!.indices = [new IndexMetadata({
                entityMetadata: <EntityMetadata>entityMetadata,
                args: {
                    target: Person,
                    name: "IDX_TEST",
                    columns: ["lastname", "firstname"],
                    unique: false
                }
            })];
            entityMetadata!.indices.forEach(index => index.build(connection.namingStrategy));

            await connection.synchronize(false);

            const queryRunner = connection.createQueryRunner();
            const table = await queryRunner.getTable("person");
            await queryRunner.release();

            expect(table!.indices.length).to.be.equal(1);
            expect(table!.indices[0].name).to.be.equal("IDX_TEST"); 
            expect(table!.indices[0].isUnique).to.be.false; 
            expect(table!.indices[0].columnNames.length).to.be.equal(2); 
            expect(table!.indices[0].columnNames[0]).to.be.equal("lastname");
            expect(table!.indices[0].columnNames[1]).to.be.equal("firstname"); 

        })));

    });

});
