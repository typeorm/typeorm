import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {TableUnique} from "../../../src/schema-builder/table/TableUnique";

describe("query runner > create constraints with data", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql", "postgres", "sqlite", "oracle"], // mysql does not supports unique constraints
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create unique constraint", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        await queryRunner.query("INSERT INTO faculty (name) VALUES ('A')");
        await queryRunner.query("INSERT INTO faculty (name) VALUES ('B')");
        await queryRunner.query("INSERT INTO faculty (name) VALUES ('C')");

        await queryRunner.query("INSERT INTO teacher (name) VALUES ('A')");
        await queryRunner.query("INSERT INTO teacher (name) VALUES ('B')");
        await queryRunner.query("INSERT INTO teacher (name) VALUES ('C')");

        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('AA', 1, 1)");
        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('AB', 1, 2)");
        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('AC', 1, 3)");
        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('BA', 2, 1)");
        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('BB', 2, 2)");
        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('BC', 2, 3)");
        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('CA', 3, 1)");
        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('CB', 3, 2)");
        await queryRunner.query("INSERT INTO student (name, facultyId, teacherId) VALUES ('CC', 3, 3)");

        // clear sqls in memory to avoid removing tables when down queries executed.
        await queryRunner.clearSqlMemory();

        const facultyUniqueConstraint = new TableUnique({name: "uq_faculty_name", columnNames: ["name"]});
        await queryRunner.createUniqueConstraint("faculty", facultyUniqueConstraint);

        await queryRunner.release();
    })));
});
