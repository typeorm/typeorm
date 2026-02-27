import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { Actor } from "./Actor"

/**
 * Organization also shares its primary key with Actor.
 * Multiple entity types can point to the same Actor table via shared-PK.
 */
@Entity()
export class Organization {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @OneToOne(() => Actor, { eager: true, cascade: true })
    @JoinColumn({ name: "id", referencedColumnName: "id" })
    actor: Actor

    @Column()
    legalName: string
}
