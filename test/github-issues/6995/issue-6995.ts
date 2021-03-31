import "reflect-metadata";
import { Connection } from "../../../src";
import { createTestingConnections, closeTestingConnections } from "../../utils/test-utils";
import { DefaultUpdateDate } from './entity/default-update-date';

describe("github issues > #6995 Generating migrations for UpdateDateColumn should generate on update clause", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        migrations: [],
        enabledDrivers: ["mysql", "mariadb"],
        schemaCreate: false,
        dropSchema: true,
        entities: [DefaultUpdateDate]
    }));
    after(() => closeTestingConnections(connections));

    it("should create migration with default ON UPDATE clause", () => Promise.all(connections.map(async connection => {

        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        sqlInMemory.upQueries.filter(i => i.query.includes("ON UPDATE")).length.should.be.greaterThan(0);

    })));

});