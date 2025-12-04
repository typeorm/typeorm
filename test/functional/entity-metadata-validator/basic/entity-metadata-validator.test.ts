import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import { ConnectionMetadataBuilder } from "../../../../src/connection/ConnectionMetadataBuilder"
import { EntityMetadataValidator } from "../../../../src/metadata-builder/EntityMetadataValidator"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("entity-metadata-validator", () => {
    it("should throw error if relation count decorator used with ManyToOne or OneToOne relations", async () => {
        const connection = new DataSource({
            // dummy connection options, connection won't be established anyway
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(
            connection,
        )
        const entityMetadatas =
            await connectionMetadataBuilder.buildEntityMetadatas([
                __dirname + "/entity/*{.js,.ts}",
            ])
        const entityMetadataValidator = new EntityMetadataValidator()
        expect(() =>
            entityMetadataValidator.validateMany(
                entityMetadatas,
                connection.driver,
            ),
        ).to.throw(Error)
    })
})
