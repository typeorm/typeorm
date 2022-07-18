import { DefaultNamingStrategy } from "typeorm/naming-strategy/DefaultNamingStrategy"
import { NamingStrategyInterface } from "typeorm/naming-strategy/NamingStrategyInterface"

export class SecondCustomNamingStrategy
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    tableName(className: string, customName: string): string {
        return customName ? customName.toLowerCase() : className.toLowerCase()
    }
}
