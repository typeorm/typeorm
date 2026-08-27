import { expect } from "chai"
import { EntityMetadataValidator } from "../../../src/metadata-builder/EntityMetadataValidator"
import type { Logger } from "../../../src/logger/Logger"
import type { EntityMetadata } from "../../../src/metadata/EntityMetadata"
import type { IndexMetadata } from "../../../src/metadata/IndexMetadata"
import type { UniqueMetadata } from "../../../src/metadata/UniqueMetadata"
import type { CheckMetadata } from "../../../src/metadata/CheckMetadata"
import type { ExclusionMetadata } from "../../../src/metadata/ExclusionMetadata"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

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

const col = (databaseName: string): ColumnMetadata =>
    ({ databaseName }) as ColumnMetadata

const index = (
    name: string,
    columns: string[],
    flags: {
        isUnique?: boolean
        isSpatial?: boolean
        isFulltext?: boolean
    } = {},
): IndexMetadata =>
    ({
        name,
        columns: columns.map(col),
        isUnique: flags.isUnique ?? false,
        isSpatial: flags.isSpatial ?? false,
        isFulltext: flags.isFulltext ?? false,
    }) as IndexMetadata

const unique = (name: string, columns: string[]): UniqueMetadata =>
    ({ name, columns: columns.map(col) }) as UniqueMetadata

const check = (name: string, expression: string): CheckMetadata =>
    ({ name, expression }) as CheckMetadata

const exclusion = (name: string, expression: string): ExclusionMetadata =>
    ({ name, expression }) as ExclusionMetadata

const entity = (
    name: string,
    opts: {
        indices?: IndexMetadata[]
        uniques?: UniqueMetadata[]
        checks?: CheckMetadata[]
        exclusions?: ExclusionMetadata[]
    } = {},
): EntityMetadata =>
    ({
        name,
        indices: opts.indices ?? [],
        uniques: opts.uniques ?? [],
        checks: opts.checks ?? [],
        exclusions: opts.exclusions ?? [],
    }) as EntityMetadata

// Expose the protected `warnDuplicateConstraints` by subclassing.
class TestableValidator extends EntityMetadataValidator {
    runDuplicateCheck(entityMetadatas: EntityMetadata[], logger: Logger) {
        this.warnDuplicateConstraints(entityMetadatas, logger)
    }
}

describe("EntityMetadataValidator > warnDuplicateConstraints", () => {
    let logger: CapturingLogger
    let validator: TestableValidator

    beforeEach(() => {
        logger = new CapturingLogger()
        validator = new TestableValidator()
    })

    it("warns when two indexes on the same entity have identical structure", () => {
        const em = entity("User", {
            indices: [index("IDX_a", ["email"]), index("IDX_b", ["email"])],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.have.length(1)
        expect(logger.warnings[0]).to.include("User")
        expect(logger.warnings[0]).to.include(
            "2 structurally identical indexes",
        )
        expect(logger.warnings[0]).to.include("IDX_a")
        expect(logger.warnings[0]).to.include("IDX_b")
    })

    it("does not warn when indexes share columns but differ in uniqueness flag", () => {
        const em = entity("User", {
            indices: [
                index("IDX_a", ["email"], { isUnique: false }),
                index("IDX_b", ["email"], { isUnique: true }),
            ],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.be.empty
    })

    it("does not warn when indexes share columns but differ in column order", () => {
        const em = entity("User", {
            indices: [
                index("IDX_a", ["firstName", "lastName"]),
                index("IDX_b", ["lastName", "firstName"]),
            ],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.be.empty
    })

    it("groups three identical indexes into a single warning", () => {
        const em = entity("User", {
            indices: [
                index("IDX_a", ["email"]),
                index("IDX_b", ["email"]),
                index("IDX_c", ["email"]),
            ],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.have.length(1)
        expect(logger.warnings[0]).to.include("3 structurally identical")
    })

    it("warns per distinct duplicate group", () => {
        const em = entity("User", {
            indices: [
                index("IDX_email_a", ["email"]),
                index("IDX_email_b", ["email"]),
                index("IDX_name_a", ["name"]),
                index("IDX_name_b", ["name"]),
            ],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.have.length(2)
    })

    it("detects duplicate unique constraints", () => {
        const em = entity("User", {
            uniques: [unique("UQ_a", ["email"]), unique("UQ_b", ["email"])],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.have.length(1)
        expect(logger.warnings[0]).to.include("unique constraints")
    })

    it("detects duplicate check constraints by normalized expression", () => {
        const em = entity("Order", {
            checks: [
                check("CHK_a", "total >= 0"),
                check("CHK_b", "   (total >= 0)  "),
            ],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.have.length(1)
        expect(logger.warnings[0]).to.include("check constraints")
    })

    it("detects duplicate exclusion constraints by normalized expression", () => {
        const em = entity("Booking", {
            exclusions: [
                exclusion("XCL_a", "USING gist (room WITH =, span WITH &&)"),
                exclusion("XCL_b", "  USING gist (room WITH =, span WITH &&) "),
            ],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.have.length(1)
        expect(logger.warnings[0]).to.include("exclusion constraints")
    })

    it("does not cross entities — duplicates only count within the same entity", () => {
        const a = entity("User", { indices: [index("IDX_a", ["email"])] })
        const b = entity("Account", { indices: [index("IDX_b", ["email"])] })
        validator.runDuplicateCheck([a, b], logger)
        expect(logger.warnings).to.be.empty
    })

    it("emits no warning for a single index of each family", () => {
        const em = entity("User", {
            indices: [index("IDX_a", ["email"])],
            uniques: [unique("UQ_a", ["username"])],
            checks: [check("CHK_a", "age > 0")],
        })
        validator.runDuplicateCheck([em], logger)
        expect(logger.warnings).to.be.empty
    })
})
