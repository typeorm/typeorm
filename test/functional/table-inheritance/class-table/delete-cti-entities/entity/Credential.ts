import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Actor } from "./Actor"

@Entity()
export class Credential {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    type: string

    @Column()
    resourceID: string

    @ManyToOne(() => Actor, (a) => a.credentials, { onDelete: "CASCADE" })
    @JoinColumn({ name: "actorId" })
    actor: Actor
}
