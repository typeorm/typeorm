import "reflect-metadata";
import { Connection } from "../../../src";

import { Category } from "../../functional/migrations/generate-command/entity";
import { createTestingConnections, closeTestingConnections } from "../../utils/test-utils";

import { Post as Post1 } from './entity/post_with_null_1.entity'
import { Post as Post2 } from './entity/post_with_null_1.entity'

describe("github issues > #6950 postgres: Inappropiate migration generated for 'default: null'", () => {
    describe('null default', () => {
        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
            migrations: [],
            enabledDrivers: ["postgres", "cockroachdb", "mysql"],
            schemaCreate: false,
            dropSchema: true,
            entities: [Post1, Category],
            schema: "public",
        }));
        // beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("can recognize model changes", () => Promise.all(connections.map(async connection => {
            const sqlInMemory = await connection.driver.createSchemaBuilder().log();
            sqlInMemory.upQueries.length.should.be.greaterThan(0);
            sqlInMemory.downQueries.length.should.be.greaterThan(0);
        })));

        it.skip("does not generate when no model changes", () => Promise.all(connections.map(async connection => {
            await connection.driver.createSchemaBuilder().build();

            const sqlInMemory = await connection.driver.createSchemaBuilder().log();

            sqlInMemory.upQueries.length.should.be.equal(0);
            sqlInMemory.downQueries.length.should.be.equal(0);

        })));

    })
    describe('null default and nullable ', () => {
        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
            migrations: [],
            enabledDrivers: ["postgres", "cockroachdb", "mysql"],
            schemaCreate: false,
            dropSchema: true,
            entities: [Post2, Category],
            schema: "public",
        }));
        // beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("can recognize model changes", () => Promise.all(connections.map(async connection => {
            const sqlInMemory = await connection.driver.createSchemaBuilder().log();
            sqlInMemory.upQueries.length.should.be.greaterThan(0);
            sqlInMemory.downQueries.length.should.be.greaterThan(0);
        })));

        it.skip("does not generate when no model changes", () => Promise.all(connections.map(async connection => {
            await connection.driver.createSchemaBuilder().build();

            const sqlInMemory = await connection.driver.createSchemaBuilder().log();

            sqlInMemory.upQueries.length.should.be.equal(0);
            sqlInMemory.downQueries.length.should.be.equal(0);

        })));

    })
});
