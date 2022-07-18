import { Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Child } from "./Child"

@Entity("test_parent")
export class Parent {
    @PrimaryGeneratedColumn({
        name: "id",
        type: "int",
    })
    public id: number

    @OneToMany((type) => Child, (child) => child.parent, {
        eager: true,
        cascade: true,
        onDelete: "CASCADE",
    })
    public children: Child[]
}
