import { Entity, OneToMany, PrimaryColumn } from "../../../../src"
import { Child } from "./Child"

@Entity()
export class Parent {
    @PrimaryColumn({ type: "bigint" })
    id: number

    @OneToMany(() => Child, (child) => child.parent, { cascade: true })
    children: Child[]
}
