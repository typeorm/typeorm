import { NamingStrategyInterface } from "./NamingStrategyInterface"
import { RandomGenerator } from "../util/RandomGenerator"
import { DefaultNamingStrategy } from "./DefaultNamingStrategy"
import { TypeORMError } from "../error"

/**
 * Shorten strategy
 */
export type ShortenStrategy = "truncate" | "hash"

/**
 * Naming strategy for legacy Oracle database with 30 bytes identifier limit.
 *
 * Currently, only column name must be shorten in order to avoid ORA-00972.
 * Issues with other identifiers were fixed.
 */
export class LegacyOracleNamingStrategy
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    public readonly IDENTIFIER_MAX_SIZE = 30
    public readonly DEFAULT_COLUMN_PREFIX = "COL_"
    protected shortenStrategy: ShortenStrategy

    constructor(shortenStrategy: ShortenStrategy = "hash") {
        super()
        this.shortenStrategy = shortenStrategy
    }

    columnName(
        propertyName: string,
        customName: string,
        embeddedPrefixes: string[],
    ): string {
        const longName: string = super.columnName(
            propertyName,
            customName,
            embeddedPrefixes,
        )
        if (this.shortenStrategy === "truncate") {
            return this.truncateIdentifier(longName)
        } else if (this.shortenStrategy === "hash") {
            return this.hashIdentifier(longName, this.DEFAULT_COLUMN_PREFIX)
        } else {
            throw new TypeORMError(`Invalid shortenStrategy`)
        }
    }

    protected hashIdentifier(input: string, prefix: string): string {
        if (prefix.length >= this.IDENTIFIER_MAX_SIZE) {
            throw new TypeORMError(
                `Prefix must be shorter than IDENTIFIER_MAX_SIZE`,
            )
        }
        return (
            prefix +
            RandomGenerator.sha1(input).substring(
                0,
                this.IDENTIFIER_MAX_SIZE - prefix.length,
            )
        )
    }

    protected truncateIdentifier(input: string): string {
        if (input.length > this.IDENTIFIER_MAX_SIZE) {
            return input.substring(0, this.IDENTIFIER_MAX_SIZE)
        } else {
            return input
        }
    }
}
