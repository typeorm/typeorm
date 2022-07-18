import { DefaultNamingStrategy } from "typeorm/naming-strategy/DefaultNamingStrategy"
import { NamingStrategyInterface } from "typeorm/naming-strategy/NamingStrategyInterface"
import { Table } from "typeorm"

export class NamingStrategyUnderTest
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    foreignKeyName(
        tableOrName: Table | string,
        columnNames: string[],
        referencedTablePath?: string,
        referencedColumnNames?: string[],
    ): string {
        tableOrName =
            typeof tableOrName === "string" ? tableOrName : tableOrName.name

        return columnNames.reduce(
            (name, column) => `${name}_${column}`,
            `fk_${tableOrName}_${referencedTablePath}`,
        )
    }
}
