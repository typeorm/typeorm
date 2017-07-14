import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Department} from "./entity/Department";
import {Employee} from "./entity/Employee";

// unskip once table inheritance support is back
describe.skip("github issues > #159 Referencing ClassTableChild build table error", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,        
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("entity should be successfully referenced to class-table entity", () => Promise.all(connections.map(async connection => {

        let department = new Department();
        department.name = "Software";

        let employee = new Employee();
        employee.firstName = "Hello";
        employee.lastName = "World";
        employee.salary = 1;

        department.manager = employee;

        await connection.manager.save(department);

        department.id.should.be.equal(1);
        department.name.should.be.equal("Software");
        department.manager.id.should.be.equal(1);
        department.manager.firstName.should.be.equal("Hello");
        department.manager.lastName.should.be.equal("World");
        department.manager.salary.should.be.equal(1);

    })));

});
