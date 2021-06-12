import "reflect-metadata";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../../../utils/test-utils";
import {Connection} from "../../../../../../src";
import {Teacher} from "./entity/Teacher";
import {Accountant} from "./entity/Accountant";
import {Person} from "./entity/Person";
import {Specialization} from "./entity/Specialization";
import {Department} from "./entity/Department";

describe("table-inheritance > single-table > relations > child-relation-type", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work correctly with OneToMany relations", () => Promise.all(connections.map(async connection => {

        // -------------------------------------------------------------------------
        // Create
        // -------------------------------------------------------------------------

        const specialization1 = new Specialization();
        specialization1.name = "Geography";
        await connection.getRepository(Specialization).save(specialization1);

        const specialization2 = new Specialization();
        specialization2.name = "Economist";
        await connection.getRepository(Specialization).save(specialization2);

        const teacher = new Teacher();
        teacher.name = "Mr. Garrison";
        teacher.data = [specialization1, specialization2];
        await connection.getRepository(Teacher).save(teacher);

        const department1 = new Department();
        department1.name = "Bookkeeping";
        await connection.getRepository(Department).save(department1);

        const department2 = new Department();
        department2.name = "HR";
        await connection.getRepository(Department).save(department2);

        const accountant = new Accountant();
        accountant.name = "Mr. Burns";
        accountant.data = [department1, department2];
        await connection.getRepository(Accountant).save(accountant);

        // -------------------------------------------------------------------------
        // Select
        // -------------------------------------------------------------------------

        let loadedTeacher = await connection.manager
            .createQueryBuilder(Teacher, "teacher")
                .leftJoinAndSelect("teacher.data", "data")
                .where("teacher.name = :name", { name: "Mr. Garrison" })
                .orderBy("teacher.id, data.id")
                .getOne();

        loadedTeacher!.should.have.all.keys("id", "name", "data");
        loadedTeacher!.id.should.equal(1);
        loadedTeacher!.name.should.equal("Mr. Garrison");
        loadedTeacher!.data.length.should.equal(2);
        loadedTeacher!.data[0].should.be.instanceOf(Specialization);
        loadedTeacher!.data[0].name.should.be.equal("Geography");
        loadedTeacher!.data[1].name.should.be.equal("Economist");

        let loadedAccountant = await connection.manager
            .createQueryBuilder(Accountant, "accountant")
            .leftJoinAndSelect("accountant.data", "data")
            .where("accountant.name = :name", { name: "Mr. Burns" })
            .orderBy("accountant.id, data.id")
            .getOne();

        loadedAccountant!.should.have.all.keys("id", "name", "data");
        loadedAccountant!.id.should.equal(2);
        loadedAccountant!.name.should.equal("Mr. Burns");
        loadedAccountant!.data.length.should.equal(2);
        loadedAccountant!.data[0].should.be.instanceOf(Department);
        loadedAccountant!.data[0].name.should.be.equal("Bookkeeping");
        loadedAccountant!.data[1].name.should.be.equal("HR");

        const loadedPersons = await connection.manager
            .createQueryBuilder(Person, "person")
            .leftJoinAndSelect("person.data", "data")
            .orderBy("person.id, data.id")
            .getMany();

        loadedPersons[0].should.have.all.keys("id", "name", "data");
        loadedPersons[0].should.be.instanceof(Teacher);
        loadedPersons[0].id.should.equal(1);
        loadedPersons[0].name.should.equal("Mr. Garrison");
        loadedPersons[0].data[0].should.be.instanceOf(Specialization);
        (loadedPersons[0] as Teacher).data.length.should.equal(2);
        (loadedPersons[0] as Teacher).data[0].name.should.be.equal("Geography");
        (loadedPersons[0] as Teacher).data[1].name.should.be.equal("Economist");
        loadedPersons[1].should.have.all.keys("id", "name", "data");
        loadedPersons[1].should.be.instanceof(Accountant);
        loadedPersons[1].id.should.equal(2);
        loadedPersons[1].name.should.equal("Mr. Burns");
        loadedPersons[1].data[0].should.be.instanceOf(Department);
        (loadedPersons[1] as Accountant).data.length.should.equal(2);
        (loadedPersons[1] as Accountant).data[0].name.should.be.equal("Bookkeeping");
        (loadedPersons[1] as Accountant).data[1].name.should.be.equal("HR");

    })));

});
