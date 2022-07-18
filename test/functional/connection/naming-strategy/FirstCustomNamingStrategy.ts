import { DefaultNamingStrategy } from "typeorm/naming-strategy/DefaultNamingStrategy"
import { NamingStrategyInterface } from "typeorm/naming-strategy/NamingStrategyInterface"

export class FirstCustomNamingStrategy
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    tableName(className: string, customName: string): string {
        return customName ? customName.toUpperCase() : className.toUpperCase()
    }
}
