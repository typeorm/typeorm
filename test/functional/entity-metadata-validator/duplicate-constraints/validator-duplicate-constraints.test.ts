import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import { ConnectionMetadataBuilder } from "../../../../src/connection/ConnectionMetadataBuilder"
import { EntityMetadataValidator } from "../../../../src/metadata-builder/EntityMetadataValidator"
import type { Logger } from "../../../../src/logger/Logger"
import { DuplicateIndexEntity } from "./entity/DuplicateIndexEntity"
import { SingleIndexEntity } from "./entity/SingleIndexEntity"

class CapturingLogger implements Logger {
    warnings: string[] = []

    logQuery() {}
    logQueryError() {}
    logQuerySlow() {}
    logSchemaBuild() {}
    logMigration() {}
    log(level: "log" | "info" | "warn", message: string) {
        if (level === "warn") this.warnings.push(message)
    }
}

describe("entity-metadata-validator > duplicate constraints", () => {
    it("warns when two @Index decorators declare the same column set", async () => {
        const connection = new DataSource({
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [DuplicateIndexEntity],
        })
        const entityMetadatas = await new ConnectionMetadataBuilder(
            connection,
        ).buildEntityMetadatas([DuplicateIndexEntity])
        const validator = new EntityMetadataValidator()
        const logger = new CapturingLogger()

        validator.validateMany(entityMetadatas, connection.driver, logger)

        expect(logger.warnings).to.have.length(1)
        expect(logger.warnings[0]).to.include("DuplicateIndexEntity")
        expect(logger.warnings[0]).to.include(
            "2 structurally identical indexes",
        )
        expect(logger.warnings[0]).to.include("IDX_user_email_one")
        expect(logger.warnings[0]).to.include("IDX_user_email_two")
    })

    it("does not warn when each constraint is declared once", async () => {
        const connection = new DataSource({
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [SingleIndexEntity],
        })
        const entityMetadatas = await new ConnectionMetadataBuilder(
            connection,
        ).buildEntityMetadatas([SingleIndexEntity])
        const validator = new EntityMetadataValidator()
        const logger = new CapturingLogger()

        validator.validateMany(entityMetadatas, connection.driver, logger)

        expect(logger.warnings).to.be.empty
    })

    it("does not warn when no logger is supplied", async () => {
        const connection = new DataSource({
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [DuplicateIndexEntity],
        })
        const entityMetadatas = await new ConnectionMetadataBuilder(
            connection,
        ).buildEntityMetadatas([DuplicateIndexEntity])
        const validator = new EntityMetadataValidator()

        // Should not throw just because the duplicate detection is skipped.
        expect(() =>
            validator.validateMany(entityMetadatas, connection.driver),
        ).to.not.throw()
    })
})
