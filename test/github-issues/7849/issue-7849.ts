import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { TestEntity } from "./entity/test.entity";

describe("github issues > #7849 Handle query builder to accomodate zero limit and zero offset", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [TestEntity],
            schemaCreate: false,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should build query with limit 0 and offset 0", () => Promise.all(connections.map(async connection => {
        const loadedEntities = await connection.createQueryBuilder().from("test", "test").limit(0).offset(0).getQuery();
        expect(typeof loadedEntities).to.be.eql("string");
        expect(loadedEntities).to.be.eql('SELECT * FROM "test" "test" LIMIT 0 OFFSET 0');
    })));

    it("should build query with limit 0 and offset 1", () => Promise.all(connections.map(async connection => {
        const loadedEntities = await connection.createQueryBuilder().from("test", "test").limit(0).offset(1).getQuery();
        expect(typeof loadedEntities).to.be.eql("string");
        expect(loadedEntities).to.be.eql('SELECT * FROM "test" "test" LIMIT 0 OFFSET 1');
    })));

    it("should build query with limit 1 and offset 0", () => Promise.all(connections.map(async connection => {
        const loadedEntities = await connection.createQueryBuilder().from("test", "test").limit(1).offset(0).getQuery();
        expect(typeof loadedEntities).to.be.eql("string");
        expect(loadedEntities).to.be.eql('SELECT * FROM "test" "test" LIMIT 1 OFFSET 0');
    })));

    it("should build query with limit 1 and offset 1", () => Promise.all(connections.map(async connection => {
        const loadedEntities = await connection.createQueryBuilder().from("test", "test").limit(1).offset(1).getQuery();
        expect(typeof loadedEntities).to.be.eql("string");
        expect(loadedEntities).to.be.eql('SELECT * FROM "test" "test" LIMIT 1 OFFSET 1');
    })));

});
