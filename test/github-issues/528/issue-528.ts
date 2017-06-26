import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {MigrationExecutor} from "../../../src/migration/MigrationExecutor";

import {Post} from "./entity/Post";
import {Author} from "./entity/Author";

describe("github issues > #528 Migrations failing on timestamp validation", () => {

    class MockMigrationExecutor extends MigrationExecutor {
        async getExecutedMigrations() {
            return await this.loadExecutedMigrations();
        }
    }

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        migrations: [__dirname + "/migrations/NewerMigration{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));

    it("should be success migrating", () => Promise.all(connections.map(async connection => {

        const author = new Author();
        author.firstName = "Artur";
        author.lastName = "Lavrischev";

        const post = new Post();
        post.title = "Hello!";
        post.author = author;

        await connection.getRepository(Post).save(post);
        await connection.runMigrations();
        await connection.close();

        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            // SecondReleaseChanges has older timestamp than FirstReleaseChanges
            migrations: [__dirname + "/migrations/OldestMigration{.js,.ts}"],
            schemaCreate: true
        });

    })));

    it("should be right migrations order", () => Promise.all(connections.map(async connection => {
        await connection.runMigrations();

        const migrations = await new MockMigrationExecutor(connection).getExecutedMigrations();
        const [OldestMigration, NewerMigration] = migrations;

        OldestMigration.name.should.be.eq("OldestMigration1481283582120");
        NewerMigration.name.should.be.eq("NewerMigration1481283582123");

        NewerMigration.timestamp.should.be.greaterThan(OldestMigration.timestamp);
    })));

    after(function () {
        closeTestingConnections(connections);
    });

});
