import "reflect-metadata"
import { expect } from "chai"
import { LegacyOracleNamingStrategy } from "../../../../../src/naming-strategy/LegacyOracleNamingStrategy"
import { RandomGenerator } from "../../../../../src/util/RandomGenerator"

describe("LegacyOracleNamingStrategy > column shortening", () => {
    it("should truncate column names to the limit", () => {
        const legacyOracleNamingStrategy = new LegacyOracleNamingStrategy(
            "truncate",
        )
        expect(
            legacyOracleNamingStrategy.columnName("shortName", "", []),
        ).to.equal("shortName")
        expect(
            legacyOracleNamingStrategy.columnName(
                "veryVeryVeryLongLongLongLongName",
                "",
                [],
            ),
        ).to.equal("veryVeryVeryLongLongLongLongNa")
        expect(
            legacyOracleNamingStrategy.columnName(
                RandomGenerator.sha1("seed1"),
                "",
                [],
            ).length,
        ).to.lessThanOrEqual(legacyOracleNamingStrategy.IDENTIFIER_MAX_SIZE)
    })

    it("should change column names to hashes within the limit", () => {
        const legacyOracleNamingStrategy = new LegacyOracleNamingStrategy(
            "hash",
        )
        const columnName: string =
            "veryVeryVeryLongLongLongLongName" + RandomGenerator.sha1("seed2")
        const hashedColumnName: string = legacyOracleNamingStrategy.columnName(
            columnName,
            "",
            [],
        )
        expect(hashedColumnName.length).to.lessThanOrEqual(
            legacyOracleNamingStrategy.IDENTIFIER_MAX_SIZE,
        )
        expect(hashedColumnName)
            .to.be.a("string")
            .and.satisfy((name: string) =>
                name.startsWith(
                    legacyOracleNamingStrategy.DEFAULT_COLUMN_PREFIX,
                ),
            )
    })
})
