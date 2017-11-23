import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {EntityMetadata} from "../../../../src/metadata/EntityMetadata";
import {IndexMetadata} from "../../../../src/metadata/IndexMetadata";
import {expect} from "chai";

import {PersonSchema} from "./entity/Person";

describe("indices > reading index from entity schema and updating database", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entitySchemas: [<any>PersonSchema],
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
            expect(table!.indices[0].columnNames[0]).to.be.equal("FirstName");
            expect(table!.indices[0].columnNames[1]).to.be.equal("LastName");

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
            expect(table!.indices[0].columnNames[0]).to.be.equal("FirstName"); 
            expect(table!.indices[0].columnNames[1]).to.be.equal("LastName");

        })));

        it("should update the index swaping the 2 columns", () => Promise.all(connections.map(async connection => {
            
            const entityMetadata = connection.entityMetadatas.find(x => x.name === "Person");
            entityMetadata!.indices = [new IndexMetadata({
                entityMetadata: <EntityMetadata>entityMetadata,
                args: {
                    target: entityMetadata!.target,
                    name: "IDX_TEST",
                    columns: ["LastName", "FirstName"],
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
            expect(table!.indices[0].columnNames[0]).to.be.equal("LastName");
            expect(table!.indices[0].columnNames[1]).to.be.equal("FirstName"); 

        })));

    });

});
