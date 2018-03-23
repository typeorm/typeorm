import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {PromiseUtils} from "../../../src";
import {Teacher} from "./entity/Teacher";
import {Post} from "./entity/Post";
import {CheckMetadata} from "../../../src/metadata/CheckMetadata";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";

describe("schema builder > change check constraint", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly add new check constraint", () => PromiseUtils.runInSequence(connections, async connection => {
        // Mysql does not support check constraints.
        if (connection.driver instanceof MysqlDriver)
            return;

        const teacherMetadata = connection.getMetadata(Teacher);
        const checkMetadata = new CheckMetadata({
            entityMetadata: teacherMetadata,
            args: {
                target: Teacher,
                expression: `"name" <> 'asd'`
            }
        });
        checkMetadata.build(connection.namingStrategy);
        teacherMetadata.checks.push(checkMetadata);

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("teacher");
        await queryRunner.release();

        table!.checks.length.should.be.equal(1);
    }));

    it("should correctly change check", () => PromiseUtils.runInSequence(connections, async connection => {
        // Mysql does not support check constraints.
        if (connection.driver instanceof MysqlDriver)
            return;

        const postMetadata = connection.getMetadata(Post);
        postMetadata.checks[0].expression = `"likesCount" < 2000`;
        postMetadata.checks[0].build(connection.namingStrategy);

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        await queryRunner.release();

        table!.checks[0].expression!.indexOf("2000").should.be.not.equal(-1);
    }));

    it("should correctly drop removed check", () => PromiseUtils.runInSequence(connections, async connection => {
        // Mysql does not support check constraints.
        if (connection.driver instanceof MysqlDriver)
            return;

        const postMetadata = connection.getMetadata(Post);
        postMetadata.checks = [];

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        await queryRunner.release();

        table!.checks.length.should.be.equal(0);
    }));

});
