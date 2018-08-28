import { expect } from "chai";
import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { MysqlDriver } from "../../../src/driver/mysql/MysqlDriver";
import { OracleDriver } from "../../../src/driver/oracle/OracleDriver";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Bar } from "./entity/Bar";

describe("github issues > #2215 - Inserting id (primary column) from code", () => {

    describe("connection with allowGeneratedValuesFromCode=true", () => {
        let connections: Connection[];
        before(async () => {
            connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                allowGeneratedValuesFromCode: true
            });
        });

        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should allow to explicitly insert primary key value with the flag allowGeneratedValuesFromCode=true", () => Promise.all(connections.map(async connection => {

            const firstBarQuery =  connection.manager.create(Bar, {
                id: 10,
                description: "forced id value"
            });
            const firstBar = await connection.manager.save(firstBarQuery);
            expect(firstBar.id).to.eql(10);
        })));
    });

    describe("connection with allowGeneratedValuesFromCode not set", () => {
        let connections: Connection[];
        before(async () => {
            connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true
            });
        });

        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should not allow to explicitly insert primary key value with the flag allowGeneratedValuesFromCode not set", () => Promise.all(connections.map(async connection => {

            const firstBarQuery =  connection.manager.create(Bar, {
                id: 10,
                description: "forced id value"
            });
            const firstBar = await connection.manager.save(firstBarQuery);
            if (connection.driver instanceof OracleDriver || connection.driver instanceof MysqlDriver) {
                expect(firstBar.id).to.eql(10);
            } else {
                expect(firstBar.id).not.to.eql(10);
            }
        })));
    });

});
