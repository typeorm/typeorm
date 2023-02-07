import { DefaultNamingStrategy } from "../../../../src/naming-strategy/DefaultNamingStrategy"
import { NamingStrategyInterface } from "../../../../src/naming-strategy/NamingStrategyInterface"

export class NamingStrategyUnderTest
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    eagerJoinRelationAlias(alias: string, propertyPath: string): string {
        return alias + "__" + propertyPath.replace(".", "_")
    }
}
