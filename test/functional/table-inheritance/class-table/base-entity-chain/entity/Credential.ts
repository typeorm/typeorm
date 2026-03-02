import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { Actor } from "./Actor"

@Entity()
export class Credential {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    type: string

    @Column({ default: "" })
    resourceID: string

    @ManyToOne(() => Actor, (actor) => actor.credentials)
    actor: Actor
}
