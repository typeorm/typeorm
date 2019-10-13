import { DefaultNamingStrategy } from "../../../../src/naming-strategy/DefaultNamingStrategy";
import { NamingStrategyInterface } from "../../../../src/naming-strategy/NamingStrategyInterface";
export declare class SecondCustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
    tableName(className: string, customName: string): string;
}
