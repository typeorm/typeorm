import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { DataSource } from "../../../src/data-source/DataSource";
import { expect } from "chai";

import { Post } from "./entity/Post"; // Ensure you have a Post entity
import { SaferMigrations, TableBackupConfig } from "../../../src/migration/SaferMigrations";

describe("SaferMigrations Utility Test", () => {
    let connections: DataSource[];

    before(
        async () =>
        (connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
            enabledDrivers: ["mysql"], // Use the appropriate driver for your setup
        }))
    );

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should backup and restore data correctly during migration", () =>
        Promise.all(
            connections.map(async function (connection) {
                const post = new Post();
                post.id = 1;
                post.text = "hello world";
                await connection.manager.save(post);

                const tableConfigs: TableBackupConfig[] = [
                    {
                        tableName: 'post',
                        primaryKeyColumns: ['id'],
                        backupColumns: ['text']
                    }
                ];

                // Backup data
                await SaferMigrations.start(connection.createQueryRunner(), tableConfigs);

                // Simulate a column type change (for testing purposes)
                await connection.query(`ALTER TABLE post MODIFY COLUMN text TEXT`);

                // Restore data
                await SaferMigrations.done(connection.createQueryRunner(), tableConfigs);

                // Verify the data is restored correctly
                const loadedPost = await connection.manager.findOne(Post, {
                    where: { text: "hello world" },
                });
                expect(loadedPost).to.not.be.null;
                expect(loadedPost?.text).to.equal("hello world");
            })
        ));

    it("should backup, drop column, add new column with different type and restore data correctly", () =>
        Promise.all(
            connections.map(async function (connection) {
                const post = new Post();
                post.id = 1;
                post.text = "hello world";
                await connection.manager.save(post);

                const tableConfigs: TableBackupConfig[] = [
                    {
                        tableName: 'post',
                        primaryKeyColumns: ['id'],
                        backupColumns: ['text']
                    }
                ];

                // Backup data
                await SaferMigrations.start(connection.createQueryRunner(), tableConfigs);

                // Simulate dropping the column and adding a new column with a different data type
                await connection.query(`ALTER TABLE post DROP COLUMN text`);
                await connection.query(`ALTER TABLE post ADD COLUMN text MEDIUMTEXT`);

                // Restore data
                await SaferMigrations.done(connection.createQueryRunner(), tableConfigs);

                // Verify the data is restored correctly
                const loadedPost = await connection.manager.findOne(Post, {
                    where: { text: "hello world" },
                });
                expect(loadedPost).to.not.be.null;
                expect(loadedPost?.text).to.equal("hello world");
            })
        ));
});
