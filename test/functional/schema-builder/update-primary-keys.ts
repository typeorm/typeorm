import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {CockroachDriver} from "../../../src/driver/cockroachdb/CockroachDriver";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Category} from "./entity/Category";
import {Question} from "./entity/Question";
import {AbstractSqliteDriver} from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver";

describe("schema builder > update primary keys", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly update composite primary keys", () => Promise.all(connections.map(async connection => {

        // CockroachDB does not support changing primary key constraint
        if (connection.driver instanceof CockroachDriver)
            return;

        const metadata = connection.getMetadata(Category);
        const nameColumn = metadata.findColumnWithPropertyName("name");
        nameColumn!.isPrimary = true;

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("category");
        table!.findColumnByName("id")!.isPrimary.should.be.true;
        table!.findColumnByName("name")!.isPrimary.should.be.true;

        await queryRunner.release();
    })));

    it("should correctly update composite primary keys when table already have primary generated column", () => Promise.all(connections.map(async connection => {
        // Sqlite does not support AUTOINCREMENT on composite primary key
        if (connection.driver instanceof AbstractSqliteDriver)
            return;

        // CockroachDB does not support changing primary key constraint
        if (connection.driver instanceof CockroachDriver)
            return;

        const metadata = connection.getMetadata(Question);
        const nameColumn = metadata.findColumnWithPropertyName("name");
        nameColumn!.isPrimary = true;

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("question");
        table!.findColumnByName("id")!.isPrimary.should.be.true;
        table!.findColumnByName("name")!.isPrimary.should.be.true;

        await queryRunner.release();
    })));

});
