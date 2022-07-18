import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Child } from "./Child"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"

@Entity()
export class Parent {
    @PrimaryGeneratedColumn()
    public id: number

    @Column()
    public name: string

    @OneToMany((target) => Child, (child) => child.parent, { lazy: true })
    public children: Promise<Child[]>
}
