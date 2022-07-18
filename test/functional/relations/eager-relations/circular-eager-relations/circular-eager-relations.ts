import "reflect-metadata"
import { DataSource } from "typeorm/data-source/DataSource"
import { EntityMetadataValidator } from "typeorm/metadata-builder/EntityMetadataValidator"
import { ConnectionMetadataBuilder } from "typeorm/connection/ConnectionMetadataBuilder"
import { expect } from "chai"

describe("relations > eager relations > circular eager relations", () => {
    it("should throw error if eager: true is set on both sides of relationship", async () => {
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
