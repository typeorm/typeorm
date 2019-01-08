import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {MigrationExecutor} from "../../../src/migration/MigrationExecutor";
import {Migration} from "../../../src/migration/Migration";
import {MongoDriver} from "../../../src/driver/mongodb/MongoDriver";
import {MongoQueryRunner} from "../../../src/driver/mongodb/MongoQueryRunner";
import {QueryRunner} from "../../../src/query-runner/QueryRunner";
import {createTestingConnections, closeTestingConnections} from "../../utils/test-utils";
import {expect} from "chai";

export class MigrationExecutor2 extends MigrationExecutor {
    // make this method public just for testing
    async loadExecutedMigrations(queryRunner: QueryRunner): Promise<Migration[]> {
        return super.loadExecutedMigrations(queryRunner);
    }
}

describe("github issues > #3375 add metadata to migrations table", () => {
    let connections: Connection[];

    async function createConnections(migrationsPath = __dirname + "/migration/*.js", dropSchema = true) {
        return createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            migrations: [migrationsPath],
            enabledDrivers: ["postgres", "mssql", "mysql", "mariadb", "sqlite", "mongodb"],
            schemaCreate: true,
            dropSchema
        });
    }

    function setup(migrationsPath = __dirname + "/migration/*.js", dropSchema = true) {
        beforeEach(async () => connections = await createConnections(migrationsPath, dropSchema));
        afterEach(() => closeTestingConnections(connections));
    }

    describe("new migrations table", () => {
        setup();

        it("should create migrations table w/ hash column", () => Promise.all(connections.map(async connection => {
            await connection.runMigrations();
            const queryRunner = connection.createQueryRunner();
            const migrationExecutor = new MigrationExecutor2(connection, queryRunner);
            const executedMigrations = await migrationExecutor.loadExecutedMigrations(queryRunner);
            expect(executedMigrations.length).to.equal(1);
            executedMigrations.forEach(executedMigration => {
                expect(executedMigration.name.length).to.be.greaterThan(0);
                expect(executedMigration.hash.length).to.be.greaterThan(0);
            });
        })));
    });

    describe("existing migration table", () => {
        setup();

        it("should add hash column when it does not exist and calculate hashes of executed migrations", () => Promise.all(connections.map(async connection => {
            await connection.runMigrations();
            const queryRunner = connection.createQueryRunner();
            if (connection.driver instanceof MongoDriver) {
                const mongoRunner = queryRunner as MongoQueryRunner;
                await mongoRunner.databaseConnection.db(connection.driver.database!).collection("migrations").updateMany({}, {$unset: {hash: 1}});
            } else {
                await queryRunner.dropColumn("migrations", "hash");
            }

            await connection.runMigrations();
            const migrationExecutor = new MigrationExecutor2(connection, queryRunner);
            const executedMigrations = await migrationExecutor.loadExecutedMigrations(queryRunner);
            expect(executedMigrations.length).to.equal(1);
            executedMigrations.forEach(executedMigration => {
                expect(executedMigration.name.length).to.be.greaterThan(0);
                expect(executedMigration.hash.length).to.be.greaterThan(0);
            });
        })));

    });

    describe("migration hash mismatch", () => {

        beforeEach(async () => {
            connections = await createConnections();
            await Promise.all(connections.map(connection => connection.runMigrations()));
            await closeTestingConnections(connections);
        });

        setup(__dirname + "/migration-invalid-hash/*.js", false);

        afterEach(() => Promise.all(connections.map(async connection => {
            delete (connection.options as any).migrationsIgnoreHash;
        })));

        it("should fail when migration hash differs", () => Promise.all(connections.map(async connection => {
            (connection.options as any).migrationsIgnoreHash = undefined;
            let error: Error|undefined = undefined;
            try {
                await connection.runMigrations();
            } catch (err) {
                error = err;
            }
            expect(error).to.be.ok;
            expect(error!.message).to.match(/migration hash/i);
        })));

        it("should succeed when migrationIgnoreHash is truthy", () => Promise.all(connections.map(async connection => {
            (connection.options as any).migrationsIgnoreHash = true;
            await connection.runMigrations();
        })));
    });

    describe("missing migration", () => {

        beforeEach(async () => {
            connections = await createConnections();
            await Promise.all(connections.map(connection => connection.runMigrations()));
            await closeTestingConnections(connections);
        });

        setup(__dirname + "/migration-empty/*.js", false);

        afterEach(() => Promise.all(connections.map(async connection => {
            delete (connection.options as any).migrationsIgnoreHash;
        })));

        it("should fail when an executed migration is missing", () => Promise.all(connections.map(async connection => {
            (connection.options as any).migrationsIgnoreHash = undefined;
            let error: Error|undefined = undefined;
            try {
                await connection.runMigrations();
            } catch (err) {
                error = err;
            }
            expect(error).to.be.ok;
            expect(error!.message).to.match(/no source migration/i);
        })));

        it("should succeed when migrationsIgnoreHash is truthy", () => Promise.all(connections.map(async connection => {
            (connection.options as any).migrationsIgnoreHash = true;
            await connection.runMigrations();
        })));
    });

 });
