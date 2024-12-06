import "reflect-metadata"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { EntityMetadataValidator } from "../../../../../src/metadata-builder/EntityMetadataValidator"
import { ConnectionMetadataBuilder } from "../../../../../src/connection/ConnectionMetadataBuilder"
import { expect } from "chai"

describe("query builder > filter condition > circular filter condition cascade", () => {
    it("should throw error if filterConditionsCascade is set on relations other than many-to-one and one-to-one", async () => {
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
