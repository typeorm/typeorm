import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "../../../../../../../src"

@Entity()
export class Part {
    @PrimaryColumn({ type: "blob" })
    serial: Uint8Array

    @Column()
    name: string

    @ManyToOne(() => Part, (part) => part.components)
    assembly?: Part | null

    @OneToMany(() => Part, (part) => part.assembly)
    components: Part[]
}
