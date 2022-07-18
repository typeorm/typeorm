import { DefaultNamingStrategy } from "typeorm/naming-strategy/DefaultNamingStrategy"
import { NamingStrategyInterface } from "typeorm/naming-strategy/NamingStrategyInterface"

export class NamingStrategyUnderTest
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    eagerJoinRelationAlias(alias: string, propertyPath: string): string {
        return alias + "__" + propertyPath.replace(".", "_")
    }
}
