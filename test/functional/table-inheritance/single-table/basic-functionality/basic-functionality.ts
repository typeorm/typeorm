import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Student} from "./entity/Student";
import {Teacher} from "./entity/Teacher";
import {Accountant} from "./entity/Accountant";
import {Employee} from "./entity/Employee";
import {Person} from "./entity/Person";

describe.skip("table-inheritance > single-table > basic-functionality", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly insert, update and delete data with single-table-inheritance pattern", () => Promise.all(connections.map(async connection => {

        // -------------------------------------------------------------------------
        // Create
        // -------------------------------------------------------------------------

        const student1 = new Student();
        student1.name = "Alice";
        student1.faculty = "Economics";
        await connection.getRepository(Student).save(student1);

        const student2 = new Student();
        student2.name = "Bob";
        student2.faculty = "Programming";
        await connection.getRepository(Student).save(student2);

        const teacher1 = new Teacher();
        teacher1.name = "Mr. Garrison";
        teacher1.specialization = "Geography";
        teacher1.salary = 2000;
        await connection.getRepository(Teacher).save(teacher1);

        const teacher2 = new Teacher();
        teacher2.name = "Mr. Adler";
        teacher2.specialization = "Mathematics";
        teacher2.salary = 4000;
        await connection.getRepository(Teacher).save(teacher2);

        const accountant1 = new Accountant();
        accountant1.name = "Mr. Burns";
        accountant1.department = "Bookkeeping";
        accountant1.salary = 3000;
        await connection.getRepository(Accountant).save(accountant1);

        const accountant2 = new Accountant();
        accountant2.name = "Mr. Trump";
        accountant2.department = "Director";
        accountant2.salary = 5000;
        await connection.getRepository(Accountant).save(accountant2);

        // -------------------------------------------------------------------------
        // Select
        // -------------------------------------------------------------------------

        let loadedStudents = await connection.manager
            .createQueryBuilder(Student, "students")
            .getMany();

        loadedStudents[0].should.have.all.keys("id", "name", "faculty");
        loadedStudents[0].id.should.equal(1);
        loadedStudents[0].name.should.equal("Alice");
        loadedStudents[0].faculty.should.equal("Economics");
        loadedStudents[1].should.have.all.keys("id", "name", "faculty");
        loadedStudents[1].id.should.equal(2);
        loadedStudents[1].name.should.equal("Bob");
        loadedStudents[1].faculty.should.equal("Programming");

        let loadedTeachers = await connection.manager
            .createQueryBuilder(Teacher, "teachers")
            .getMany();

        loadedTeachers[0].should.have.all.keys("id", "name", "specialization", "salary");
        loadedTeachers[0].id.should.equal(3);
        loadedTeachers[0].name.should.equal("Mr. Garrison");
        loadedTeachers[0].specialization.should.equal("Geography");
        loadedTeachers[0].salary.should.equal(2000);
        loadedTeachers[1].should.have.all.keys("id", "name", "specialization", "salary");
        loadedTeachers[1].id.should.equal(4);
        loadedTeachers[1].name.should.equal("Mr. Adler");
        loadedTeachers[1].specialization.should.equal("Mathematics");
        loadedTeachers[1].salary.should.equal(4000);

        let loadedAccountants = await connection.manager
            .createQueryBuilder(Accountant, "accountants")
            .getMany();

        loadedAccountants[0].should.have.all.keys("id", "name", "department", "salary");
        loadedAccountants[0].id.should.equal(5);
        loadedAccountants[0].name.should.equal("Mr. Burns");
        loadedAccountants[0].department.should.equal("Bookkeeping");
        loadedAccountants[0].salary.should.equal(3000);
        loadedAccountants[1].should.have.all.keys("id", "name", "department", "salary");
        loadedAccountants[1].id.should.equal(6);
        loadedAccountants[1].name.should.equal("Mr. Trump");
        loadedAccountants[1].department.should.equal("Director");
        loadedAccountants[1].salary.should.equal(5000);

        // -------------------------------------------------------------------------
        // Update
        // -------------------------------------------------------------------------

        let loadedStudent = await connection.manager
            .createQueryBuilder(Student, "student")
            .where("student.name = :name", { name: "Bob" })
            .getOne();

        loadedStudent!.faculty = "Chemistry";
        await connection.getRepository(Student).save(loadedStudent!);

        loadedStudent = await connection.manager
            .createQueryBuilder(Student, "student")
            .where("student.name = :name", { name: "Bob" })
            .getOne();

        loadedStudent!.should.have.all.keys("id", "name", "faculty");
        loadedStudent!.id.should.equal(2);
        loadedStudent!.name.should.equal("Bob");
        loadedStudent!.faculty.should.equal("Chemistry");

        let loadedTeacher = await connection.manager
            .createQueryBuilder(Teacher, "teacher")
            .where("teacher.name = :name", { name: "Mr. Adler" })
            .getOne();

        loadedTeacher!.salary = 1000;
        await connection.getRepository(Teacher).save(loadedTeacher!);

        loadedTeacher = await connection.manager
            .createQueryBuilder(Teacher, "teacher")
            .where("teacher.name = :name", { name: "Mr. Adler" })
            .getOne();

        loadedTeacher!.should.have.all.keys("id", "name", "specialization", "salary");
        loadedTeacher!.id.should.equal(4);
        loadedTeacher!.name.should.equal("Mr. Adler");
        loadedTeacher!.specialization.should.equal("Mathematics");
        loadedTeacher!.salary.should.equal(1000);

        let loadedAccountant = await connection.manager
            .createQueryBuilder(Accountant, "accountant")
            .where("accountant.name = :name", { name: "Mr. Trump" })
            .getOne();

        loadedAccountant!.salary = 1000;
        await connection.getRepository(Accountant).save(loadedAccountant!);

        loadedAccountant = await connection.manager
            .createQueryBuilder(Accountant, "accountant")
            .where("accountant.name = :name", { name: "Mr. Trump" })
            .getOne();

        loadedAccountant!.should.have.all.keys("id", "name", "department", "salary");
        loadedAccountant!.id.should.equal(6);
        loadedAccountant!.name.should.equal("Mr. Trump");
        loadedAccountant!.department.should.equal("Director");
        loadedAccountant!.salary.should.equal(1000);

        // -------------------------------------------------------------------------
        // Delete
        // -------------------------------------------------------------------------

        await connection.getRepository(Student).remove(loadedStudent!);

        loadedStudents = await connection.manager
            .createQueryBuilder(Student, "students")
            .getMany();

        loadedStudents.length.should.equal(1);
        loadedStudents[0].should.have.all.keys("id", "name", "faculty");
        loadedStudents[0].id.should.equal(1);
        loadedStudents[0].name.should.equal("Alice");
        loadedStudents[0].faculty.should.equal("Economics");

        await connection.getRepository(Teacher).remove(loadedTeacher!);

        loadedTeachers = await connection.manager
            .createQueryBuilder(Teacher, "teachers")
            .getMany();

        loadedTeachers.length.should.equal(1);
        loadedTeachers[0].should.have.all.keys("id", "name", "specialization", "salary");
        loadedTeachers[0].id.should.equal(3);
        loadedTeachers[0].name.should.equal("Mr. Garrison");
        loadedTeachers[0].specialization.should.equal("Geography");
        loadedTeachers[0].salary.should.equal(2000);

        await connection.getRepository(Accountant).remove(loadedAccountant!);

        loadedAccountants = await connection.manager
            .createQueryBuilder(Accountant, "accountants")
            .getMany();

        loadedAccountants.length.should.equal(1);
        loadedAccountants[0].should.have.all.keys("id", "name", "department", "salary");
        loadedAccountants[0].id.should.equal(5);
        loadedAccountants[0].name.should.equal("Mr. Burns");
        loadedAccountants[0].department.should.equal("Bookkeeping");
        loadedAccountants[0].salary.should.equal(3000);

        // -------------------------------------------------------------------------
        // Select parent objects
        // -------------------------------------------------------------------------

        const loadedEmployees = await connection.manager
            .createQueryBuilder(Employee, "employees")
            .getMany();

        loadedEmployees[0].should.have.all.keys("id", "name", "salary", "specialization");
        loadedEmployees[0].should.be.instanceof(Teacher);
        loadedEmployees[0].id.should.equal(3);
        loadedEmployees[0].name.should.equal("Mr. Garrison");
        (loadedEmployees[0] as Teacher).specialization = "Geography";
        loadedEmployees[0].salary.should.equal(2000);
        loadedEmployees[1].should.have.all.keys("id", "name", "salary", "department");
        loadedEmployees[1].should.be.instanceof(Accountant);
        loadedEmployees[1].id.should.equal(5);
        loadedEmployees[1].name.should.equal("Mr. Burns");
        (loadedEmployees[1] as Accountant).department = "Bookkeeping";
        loadedEmployees[1].salary.should.equal(3000);

        const loadedPersons = await connection.manager
            .createQueryBuilder(Person, "persons")
            .getMany();

        loadedPersons[0].should.have.all.keys("id", "name", "faculty");
        loadedPersons[0].should.be.instanceof(Student);
        loadedPersons[0].id.should.equal(1);
        loadedPersons[0].name.should.equal("Alice");
        (loadedPersons[0] as Student).faculty = "Economics";
        loadedPersons[1].should.have.all.keys("id", "name", "salary", "specialization");
        loadedPersons[1].should.be.instanceof(Teacher);
        loadedPersons[1].id.should.equal(3);
        loadedPersons[1].name.should.equal("Mr. Garrison");
        (loadedPersons[1] as Teacher).specialization = "Geography";
        (loadedPersons[1] as Teacher).salary.should.equal(2000);
        loadedPersons[2].should.have.all.keys("id", "name", "salary", "department");
        loadedPersons[2].should.be.instanceof(Accountant);
        loadedPersons[2].id.should.equal(5);
        loadedPersons[2].name.should.equal("Mr. Burns");
        (loadedPersons[2] as Accountant).department = "Bookkeeping";
        (loadedPersons[2] as Accountant).salary.should.equal(3000);

    })));

});
