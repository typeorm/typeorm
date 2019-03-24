import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { MyEntity } from "./entity/Entity";

describe("github issues > #3828 Conflicting PR to fix postgres schema:log with uppercase table names and enums", () => {

    let connections: Connection[];

    before(async () => {
        connections = await createTestingConnections({
            entities: [MyEntity],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
            logging: true
        });
    });

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work on public schema and all lowercase", () => Promise.all(connections.map(async connection => {
        // Rename type to what typeorm created <= 0.2.14
        // @see https://github.com/typeorm/typeorm/commit/0338d5eedcaedfd9571a90ebe1975b9b07c8e07a
        await connection.query(`ALTER TYPE "myentity_mycolumn_enum" RENAME TO "MyEntity_mycolumn_enum"`);

        // Sync database, so that typeorm create the table and enum type
        await connection.synchronize();
    })));
});
