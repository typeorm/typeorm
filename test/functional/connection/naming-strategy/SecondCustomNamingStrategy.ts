import { DefaultNamingStrategy, NamingStrategyInterface } from "@typeorm/core";

export class SecondCustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string, customName: string): string {
        return customName ? customName.toLowerCase() : className.toLowerCase();
    }

}
