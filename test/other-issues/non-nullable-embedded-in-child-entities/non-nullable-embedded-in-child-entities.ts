import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {Car} from "./entity/Car";
import {expect} from "chai";
import {ColumnMetadata} from "../../../src/metadata/ColumnMetadata";

describe("other issues > embedded columns in child entities should be nullable by default", () => {

    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
    }));

    beforeEach(() => reloadTestingDatabases(connections));

    after(() => closeTestingConnections(connections));


    it("columns from child entities should be nullable by default", () => {

        connections.map(connection => {
            expect((connection.getMetadata(Car).findColumnWithPropertyPath("brand") as ColumnMetadata).isNullable).to.be.true;
        });

    });

    it("columns embedded in child entities should be nullable by default", () => {

        connections.map(connection => {
            expect((connection.getMetadata(Car).findColumnWithPropertyPath("motor.horsepower") as ColumnMetadata).isNullable).to.be.true;
            expect((connection.getMetadata(Car).findColumnWithPropertyPath("motor.torque") as ColumnMetadata).isNullable).to.be.true;
        });

    });

});