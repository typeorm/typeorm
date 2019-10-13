import { DefaultNamingStrategy } from "../../../../src/naming-strategy/DefaultNamingStrategy";
import { NamingStrategyInterface } from "../../../../src/naming-strategy/NamingStrategyInterface";
export declare class NamingStrategyUnderTest extends DefaultNamingStrategy implements NamingStrategyInterface {
    calledJoinTableColumnName: boolean[];
    calledJoinTableInverseColumnName: boolean[];
    joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string;
    joinTableInverseColumnName(tableName: string, propertyName: string, columnName?: string): string;
}
