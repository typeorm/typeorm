import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Parent } from "./Parent"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"

@Entity()
export class Child {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public name: string

    @ManyToOne((target) => Parent, (parent) => parent.children, { lazy: true })
    public parent: Promise<Parent> | Parent
}
