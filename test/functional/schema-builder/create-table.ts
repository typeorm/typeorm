import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";

describe("schema builder > create table", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly create tables with all dependencies", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        let postTable = await queryRunner.getTable("post");
        let teacherTable = await queryRunner.getTable("teacher");
        let studentTable = await queryRunner.getTable("student");
        let facultyTable = await queryRunner.getTable("faculty");
        expect(postTable).to.be.undefined;
        expect(teacherTable).to.be.undefined;
        expect(studentTable).to.be.undefined;
        expect(facultyTable).to.be.undefined;

        await connection.synchronize();

        postTable = await queryRunner.getTable("post");
        const idColumn = postTable!.findColumnByName("id");
        const versionColumn = postTable!.findColumnByName("version");
        const nameColumn = postTable!.findColumnByName("name");
        postTable!.should.exist;

        if (connection.driver instanceof MysqlDriver) {
            postTable!.indices.length.should.be.equal(2);
        } else {
            postTable!.uniques.length.should.be.equal(2);
            postTable!.checks.length.should.be.equal(1);
        }

        idColumn!.isPrimary.should.be.true;
        versionColumn!.isUnique.should.be.true;
        nameColumn!.default!.should.be.exist;

        teacherTable = await queryRunner.getTable("teacher");
        teacherTable!.should.exist;

        studentTable = await queryRunner.getTable("student");
        studentTable!.should.exist;
        studentTable!.indices.length.should.be.equal(1);
        studentTable!.foreignKeys.length.should.be.equal(2);

        facultyTable = await queryRunner.getTable("faculty");
        facultyTable!.should.exist;

        await queryRunner.release();
    })));

});
