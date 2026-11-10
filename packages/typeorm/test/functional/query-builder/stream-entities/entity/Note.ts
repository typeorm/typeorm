import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { Audited } from "./Audited"

/**
 * Has no listener of its own, but joins to an entity that does — the load
 * event is broadcast for joined entities as well as the root.
 */
@Entity()
export class Note {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Audited)
    audited: Audited
}
