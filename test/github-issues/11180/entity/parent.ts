import { Entity, PrimaryColumn, OneToOne } from "../../../../src"
import { Child } from "./child"

@Entity()
export class Parent {
    @PrimaryColumn()
    id: string

    @OneToOne(() => Child, (item) => item.parent)
    child?: Child
}
