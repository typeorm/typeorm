// import {expect} from "chai";
import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Address } from "./entity/Address";
import { Car } from "./entity/Car";
import { Person } from "./entity/Person";

describe("github issues > #XXXX eager relation with deleted at column skips children relations", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Address, Person, Car],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should select children of an eager relation", () => Promise.all(connections.map(async connection => {

        const userNormal = new Person();
        userNormal.name = "normal";

        await connection.getRepository(Person).save(userNormal);


        const car = new Car();
        car.type = "VW";
        car.person = userNormal;
        await connection.getRepository(Car).save(car);

        const address = new Address();
        address.country = "DK";
        address.person = userNormal;

        await connection.getRepository(Address).save(address);

        await connection.getRepository(Car).save(car);


        const result = await connection.getRepository(Address).find({
            // loadEagerRelations: false, // <-- This solves it
            relations: [
                "person",
                "person.cars", // <- Not returned
            ]
        });

        console.log(result);
    })));
});
