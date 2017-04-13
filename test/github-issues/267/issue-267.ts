import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {DataTransformationUtils} from "../../../src/util/DataTransformationUtils";
import {Person} from "./entity/Person";


describe("github issues > #267 Adding Fractional Seconds", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchemaOnConnection: true,
        }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("entity should be successfully with fractional seconds", () => Promise.all(connections.map(async connection => {

        let person = new Person();

        person.firstName = "Hello";
        person.lastName = "World";
        person.birthday = "2017-01-01 12:01:05.123456";
        person.aTime = "2017-01-01 12:01:05.123456";
        person.bTime = "2017-01-01 12:01:05.123456";
        person.cTime = "2017-01-01 12:01:05.123456";
        person.dTime = "2017-01-01 12:01:05.123456";
        person.eTime = "2017-01-01 12:01:05.123456";
        person.fTime = "2017-01-01 12:01:05.123456";

        await connection.entityManager.persist(person);

        let retrievedPerson = await connection.getRepository(Person).findOneById(person.id);

        if (retrievedPerson) {
            retrievedPerson.id.should.be.equal(person.id);
            retrievedPerson.firstName.should.be.equal("Hello");
            retrievedPerson.lastName.should.be.equal("World");

            if (connection.driver.options.type === "mysql"
                || connection.driver.options.type === "mssql"
                || connection.driver.options.type === "postgres") {
                DataTransformationUtils.mixedDateToDatetimeString(retrievedPerson.birthday).should.be.equal("2017-01-01 12:01:05.000");
                DataTransformationUtils.mixedDateToDatetimeString(retrievedPerson.aTime).should.be.equal("2017-01-01 12:01:05.100");
                DataTransformationUtils.mixedDateToDatetimeString(retrievedPerson.bTime).should.be.equal("2017-01-01 12:01:05.120");
                DataTransformationUtils.mixedDateToDatetimeString(retrievedPerson.cTime).should.be.equal("2017-01-01 12:01:05.123");

                // JS Date class only does up to milliseconds. Future might have a plan for microseconds
                DataTransformationUtils.mixedDateToDatetimeString(retrievedPerson.dTime).should.be.equal("2017-01-01 12:01:05.123");
                DataTransformationUtils.mixedDateToDatetimeString(retrievedPerson.eTime).should.be.equal("2017-01-01 12:01:05.123");
                DataTransformationUtils.mixedDateToDatetimeString(retrievedPerson.fTime).should.be.equal("2017-01-01 12:01:05.123");
            }
        }
    })));

});
