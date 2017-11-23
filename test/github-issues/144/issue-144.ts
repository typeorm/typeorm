import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Student} from "./entity/Student";

// todo fix this test once class table inheritance support is back
describe.skip("github issues > #144 Class Table Inheritance doesn't seem to work", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should persist class table child successfully", () => Promise.all(connections.map(async connection => {

        const studentRepository = connection.getRepository(Student);

        const student = new Student();
        student.firstName = "Hello";
        student.lastName = "World";
        student.faculty = "University";

        await studentRepository.save(student);


    })));

});
