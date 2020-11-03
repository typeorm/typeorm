import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Person } from "./entity/Person";
import { Identifier } from "./entity/Identifier";
import { getMetadataArgsStorage } from "../../../src";
import { ColumnMetadataArgs } from "../../../src/metadata-args/ColumnMetadataArgs";

function testSuite(sql: boolean = true) {
    let connections: Connection[];
    before(async () => {
        if (!sql) {
            // Set Identifier Entity ID column mode to ObjectID for NoSQL
            const metadataColumns = getMetadataArgsStorage().columns;
            metadataColumns.forEach((column, index) => {
                if (
                    column.target === Identifier &&
                    column.propertyName === "id"
                ) {
                    metadataColumns[index] = {
                        target: Identifier,
                        propertyName: "id",
                        mode: "objectId",
                        options: column.options,
                    } as ColumnMetadataArgs;
                }
            });
        }
        connections = await createTestingConnections({
            enabledDrivers: sql
                ? [
                      "mysql",
                      "postgres",
                      "cockroachdb",
                      "sap",
                      "mariadb",
                      "sqlite",
                      "cordova",
                      "react-native",
                      "nativescript",
                      "sqljs",
                      "oracle",
                      "mssql",
                      "aurora-data-api",
                      "aurora-data-api-pg",
                      "expo",
                      "better-sqlite3",
                  ]
                : ["mongodb"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should persist successfully and return domain entity", () =>
        Promise.all(
            connections.map(async (connection) => {
                const person = Person.createFromMap({
                    id: new Identifier("d7ab0f10-b8c2-4e12-a9a4-f9f8cc8dcf17"),
                    fullName: "Hello World",
                });
                const returnedPerson = await connection.manager.save(person);

                expect(returnedPerson).not.to.be.undefined;
                returnedPerson.should.be.equal(person);

                const foundPerson = await connection.manager.findOneOrFail(
                    Person
                );

                foundPerson.firstName.should.be.equal("Hello");
                foundPerson.lastName.should.be.equal("World");
            })
        ));
}

describe("github issues > #6993 Implement optional Domain Entity Mapper for better Object Oriented design patterns (SQL)", () =>
    testSuite());

describe("github issues > #6993 Implement optional Domain Entity Mapper for better Object Oriented design patterns (NoSQL)", () =>
    testSuite(false));
