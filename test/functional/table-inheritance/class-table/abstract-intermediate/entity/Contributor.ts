import { Column } from "../../../../../../src/decorator/columns/Column"
import { Actor } from "./Actor"

/**
 * Abstract intermediate class — NOT decorated with @ChildEntity(),
 * but carries TypeORM @Column decorators. These columns should be
 * inherited by concrete child entities (User, Organization) and placed
 * in their respective tables (concrete table inheritance of the
 * intermediate's columns).
 */
export abstract class Contributor extends Actor {
    @Column()
    reputation: number
}
