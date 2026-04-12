import { Column } from "../../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { OneToMany } from "../../../../../../../src/decorator/relations/OneToMany"
import { Child } from "./Child"

@Entity()
export class Parent {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Child, (child) => child.parent, {
        cascade: ["insert"],
        eager: true,
        orphanedRowAction: "nullify",
    })
    children: Child[]

    constructor(name: string) {
        this.name = name
    }
}
