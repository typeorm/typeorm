import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";

import {Person} from "./entity/Person";

describe("indices > reading index from entity schema and updating database", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Person],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("create unique constraint", function() {

        it("should create a table containing a unique constraint in one column", () => Promise.all(connections.map(async connection => {

            const queryRunner = connection.createQueryRunner();
            const table = await queryRunner.getTable("person");
            await queryRunner.release();

            expect(table!.findColumnByName("lastname")!.isUnique).to.be.true;

        })));
            
        it("should not change the constraint when the schema is rebuild", () => Promise.all(connections.map(async connection => {
            
            await connection.synchronize(false);
            
            const queryRunner = connection.createQueryRunner();
            const table = await queryRunner.getTable("person");
            await queryRunner.release();

            expect(table!.findColumnByName("lastname")!.isUnique).to.be.true;
            
        })));

        it("should drop the unique constaint", () => Promise.all(connections.map(async connection => {
            
            const entityMetadata = connection.entityMetadatas.find(x => x.name === "Person");
            entityMetadata!.findColumnWithPropertyName("lastname")!.isUnique = false;

            await connection.synchronize(false);
            
            const queryRunner = connection.createQueryRunner();
            const table = await queryRunner.getTable("person");
            await queryRunner.release();

            table!.findColumnByName("lastname")!.isUnique = false;

        })));

        it("should add the unique constaint again", () => Promise.all(connections.map(async connection => {
            
            const entityMetadata = connection.entityMetadatas.find(x => x.name === "Person");
            entityMetadata!.findColumnWithPropertyName("lastname")!.isUnique = true;

            await connection.synchronize(false);
            
            const queryRunner = connection.createQueryRunner();
            const table = await queryRunner.getTable("person");
            await queryRunner.release();

            table!.findColumnByName("lastname")!.isUnique = false;

        })));

    });

});
