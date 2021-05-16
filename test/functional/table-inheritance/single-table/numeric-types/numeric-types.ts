import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Student} from "./entity/Student";
import {Teacher} from "./entity/Teacher";
import {Person} from "./entity/Person";
import {CockroachDriver} from "../../../../../src/driver/cockroachdb/CockroachDriver";

describe("table-inheritance > single-table > numeric types", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Person, Student, Teacher]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should allow numeric types for the discriminator, including 0", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof CockroachDriver) {
            return;
        }

        // -------------------------------------------------------------------------
        // Create
        // -------------------------------------------------------------------------

        const student = new Student();
        student.name = "Alice";
        student.faculty = "Economics";
        await connection.getRepository(Student).save(student);

        const teacher = new Teacher();
        teacher.name = "Roger";
        teacher.specialization = "Math";
        await connection.getRepository(Teacher).save(teacher);

        // -------------------------------------------------------------------------
        // Select
        // -------------------------------------------------------------------------

        let persons = await connection.manager
            .createQueryBuilder(Person, "person")
            .getMany();

        expect(persons[0].id).to.be.equal(1);
        expect(persons[0].type).to.be.equal(0);
        expect(persons[0].name).to.be.equal("Alice");
        expect((persons[0] as Student).faculty).to.be.equal("Economics");

        expect(persons[1].id).to.be.equal(2);
        expect(persons[1].type).to.be.equal(1);
        expect(persons[1].name).to.be.equal("Roger");
        expect((persons[1] as Teacher).specialization).to.be.equal("Math");
    })));

});
