import "reflect-metadata";
import {createTestingConnections, closeTestingConnections} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import { Category, Post } from "./entity";

describe("migrations > generate command", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        migrations: [],
        schemaCreate: false,
        dropSchema: true,
        entities: [Post, Category],
    }));
    after(() => closeTestingConnections(connections));

    it("can recognize model changes", () => Promise.all(connections.map(async connection => {
        const sqlInMemory = await connection.driver.createSchemaBuilder().log();
        sqlInMemory.upQueries.length.should.be.greaterThan(0);
        sqlInMemory.downQueries.length.should.be.greaterThan(0);
    })));

    it("does not generate when no model changes", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();

        const sqlInMemory = await connection.driver.createSchemaBuilder().log();

        sqlInMemory.upQueries.length.should.be.equal(0);
        sqlInMemory.downQueries.length.should.be.equal(0);

    })));
 });
