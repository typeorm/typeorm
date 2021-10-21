import "reflect-metadata";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { Property } from "./entity/Property";

describe("github issues > #8297", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mssql"],
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return items and count", () => {
        return Promise.all(
            connections.map(async (connection) => {
                await connection
                    .getRepository(Property)
                    .save({ id: 1, name: "Office" });

                const qb = connection
                    .createQueryBuilder(Property, "property")
                    .leftJoinAndSelect("property.type", "type")
                    .leftJoinAndSelect("property.leases", "leases");

                const items = await qb.getMany();
                const count = await qb.getCount();

                expect(items.length).to.eq(1);
                expect(count).to.eq(1);
            })
        );
    });
});
