import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { Parent } from "./Parent"

@Entity()
export class Child {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string

    @ManyToOne(() => Parent)
    @JoinColumn({ name: "parentId" })
    parent?: Parent
}
