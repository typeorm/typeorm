import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Child } from "./Child"

@Entity()
export class Grandchild {
    @PrimaryGeneratedColumn()
    id: number

    @ManyToOne(() => Child, (parent) => parent.children)
    parent?: Child
}
