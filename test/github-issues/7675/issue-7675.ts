import "reflect-metadata";
import {Between, Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Foo} from "./entity/Foo";

describe("github issues > #7675 [sqlite] Find operation with between filter returns empty array", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["sqlite"],
        schemaCreate: true,
        dropSchema: true,
        entities: [Foo],
    }));
    after(() => closeTestingConnections(connections));

    it("should correctly perform select queries using Date objects as parameters on sqlite", () => Promise.all(connections.map(async connection => {
        const repository = connection.getRepository(Foo);

        const obj = await repository.save({ someField: new Date("2020-08-29") });
        await repository.save({ someField: new Date("2020-09-23") });
        
        let startDate = new Date("2020-08-01");
        let endDate = new Date("2020-09-01");

        const res = await repository.find({
            where: { someField: Between(startDate, endDate) },
        });
        
        res.length.should.be.equal(1);
        res[0].someField.should.be.eql(obj.someField);
    })));
});
