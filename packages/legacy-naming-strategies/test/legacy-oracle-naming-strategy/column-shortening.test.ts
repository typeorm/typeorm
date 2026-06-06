import { expect } from "chai"
import { LegacyOracleNamingStrategy } from "../../src/legacy-oracle-naming-strategy"

describe("LegacyOracleNamingStrategy", () => {
    it("should truncate column names longer than 30 characters", () => {
        // given
        const legacyOracleNamingStrategy = new LegacyOracleNamingStrategy(
            "truncate",
        )
        const longColumnName = "veryVeryVeryLongLongLongLongName"

        // when
        const truncatedColumnName = legacyOracleNamingStrategy.columnName(
            longColumnName,
            "",
            [],
        )

        // then
        expect(truncatedColumnName).to.equal("veryVeryVeryLongLongLongLongNa")
    })

    it("should not truncate column names shorter than 30 characters", () => {
        // given
        const legacyOracleNamingStrategy = new LegacyOracleNamingStrategy(
            "truncate",
        )
        const shortColumnName = "shortName"

        // when
        const truncatedColumnName = legacyOracleNamingStrategy.columnName(
            shortColumnName,
            "",
            [],
        )

        // then
        expect(truncatedColumnName).to.equal("shortName")
    })

    it("should change column names to hashes when longer than 30 characters", () => {
        // given
        const legacyOracleNamingStrategy = new LegacyOracleNamingStrategy(
            "hash",
        )
        const longColumnName = "veryVeryVeryLongLongLongLongName"

        // when
        const hashedColumnName = legacyOracleNamingStrategy.columnName(
            longColumnName,
            "",
            [],
        )

        // then
        expect(hashedColumnName.length).to.lessThanOrEqual(
            legacyOracleNamingStrategy.IDENTIFIER_MAX_SIZE,
        )
        expect(hashedColumnName).to.be.a("string")
        expect(hashedColumnName).to.satisfy((name: string) =>
            name.startsWith(legacyOracleNamingStrategy.DEFAULT_COLUMN_PREFIX),
        )
    })
})
