import { DefaultNamingStrategy } from "../../../../src/naming-strategy/DefaultNamingStrategy";
import { NamingStrategyInterface } from "../../../../src/naming-strategy/NamingStrategyInterface";
import { Table } from "../../../../src";
export declare class NamingStrategyUnderTest extends DefaultNamingStrategy implements NamingStrategyInterface {
    foreignKeyName(tableOrName: Table | string, columnNames: string[], referencedTablePath?: string, referencedColumnNames?: string[]): string;
}
