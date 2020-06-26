import { DefaultNamingStrategy, NamingStrategyInterface } from "@typeorm/core";

export class FirstCustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string, customName: string): string {
        return customName ? customName.toUpperCase() : className.toUpperCase();
    }

}
