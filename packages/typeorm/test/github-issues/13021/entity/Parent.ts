import { Entity, PrimaryColumn, OneToMany } from "../../../../src"
import { Comp } from "./Comp"

@Entity()
export class Parent {
    @PrimaryColumn()
    id: string

    @OneToMany(() => Comp, (c) => c.parent)
    comp: Comp[]
}
