import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { Actor } from "./Actor"

/**
 * User shares its primary key with Actor via @JoinColumn({ name: 'id' }).
 * This means user.id IS the FK to actor.id — the "shared-PK" pattern.
 * Cascade insert must insert Actor first, then User.
 */
@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @OneToOne(() => Actor, { eager: true, cascade: true })
    @JoinColumn({ name: "id", referencedColumnName: "id" })
    actor: Actor

    @Column()
    email: string
}
