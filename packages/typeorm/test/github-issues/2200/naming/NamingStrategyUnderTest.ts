import { DefaultNamingStrategy } from "../../../../src/naming-strategy/DefaultNamingStrategy"
import type { NamingStrategyInterface } from "../../../../src/naming-strategy/NamingStrategyInterface"

export class NamingStrategyUnderTest
    extends DefaultNamingStrategy
    implements NamingStrategyInterface {}
