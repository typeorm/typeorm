import { expect } from "chai"
import { DataSource, TypeORMError } from "../../../../src"
import { ConnectionMetadataBuilder } from "../../../../src/connection/ConnectionMetadataBuilder"
import { EntityMetadataValidator } from "../../../../src/metadata-builder/EntityMetadataValidator"
import { NonStrictAnyEntity } from "./entity/NonStrictAnyEntity"
import { StrictAnyEntity } from "./entity/StrictAnyEntity"

describe("entity-metadata-validator > sqlite any type", () => {
    it("should throw error when any type is used without strict mode", async () => {
        const connection = new DataSource({
            type: "better-sqlite3",
            database: ":memory:",
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })

        const connectionMetadataBuilder = new ConnectionMetadataBuilder(
            connection,
        )
        const entityMetadatas =
            await connectionMetadataBuilder.buildEntityMetadatas([
                NonStrictAnyEntity,
            ])

        const entityMetadataValidator = new EntityMetadataValidator()

        expect(() =>
            entityMetadataValidator.validateMany(
                entityMetadatas,
                connection.driver,
            ),
        ).to.throw(
            TypeORMError,
            'Column "payload" of Entity "NonStrictAnyEntity" uses SQLite "any" type, but the entity is not marked as strict. Set "strict: true" in @Entity options to use type "any".',
        )
    })

    it("should not throw error when any type is used with strict mode", async () => {
        const connection = new DataSource({
            type: "better-sqlite3",
            database: ":memory:",
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })

        const connectionMetadataBuilder = new ConnectionMetadataBuilder(
            connection,
        )
        const entityMetadatas =
            await connectionMetadataBuilder.buildEntityMetadatas([
                StrictAnyEntity,
            ])

        const entityMetadataValidator = new EntityMetadataValidator()

        expect(() =>
            entityMetadataValidator.validateMany(
                entityMetadatas,
                connection.driver,
            ),
        ).to.not.throw(TypeORMError)
    })
})
