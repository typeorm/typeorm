import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../../../src/connection/Connection";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../utils/test-utils";

describe("cube-postgres", () => {
    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"]
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create correct schema with Postgres' cube type", () =>
        Promise.all(
            connections.map(async connection => {
                const queryRunner = connection.createQueryRunner();
                const schema = await queryRunner.getTable("post");
                await queryRunner.release();
                expect(schema).not.to.be.undefined;
                const cubeColumn = schema!.columns.find(
                    tableColumn =>
                        tableColumn.name === "color" &&
                        tableColumn.type === "cube"
                );
                expect(cubeColumn).to.not.be.undefined;
            })
        ));
});
