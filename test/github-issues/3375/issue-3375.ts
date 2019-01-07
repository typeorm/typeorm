import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {MigrationExecutor} from "../../../src/migration/MigrationExecutor";
import {Migration} from "../../../src/migration/Migration";
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
            // enabledDrivers: ["postgres", "mssql", "mysql", "mariadb", "sqlite"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema,
            logging: true,
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
            const result = await connection.createQueryRunner().hasColumn("migrations", "hash");
            expect(result).to.equal(true);
        })));
    });

    describe("existing migration table", () => {
        setup();

        it("should add hash column when it does not exist and calculate hashes of executed migrations", () => Promise.all(connections.map(async connection => {
            await connection.runMigrations();
            const queryRunner = await connection.createQueryRunner();
            await queryRunner.dropColumn("migrations", "hash");

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
            console.log("executing migrations...");
            await Promise.all(connections.map(connection => connection.runMigrations()));
            console.log("executed migrations...");
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
                console.log("executing migrations AGAIN");
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

 });
