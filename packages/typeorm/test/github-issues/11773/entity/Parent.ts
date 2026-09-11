import { Entity, OneToMany, PrimaryColumn } from "../../../../src"
import { Child } from "./Child"

@Entity()
export class Parent {
    // Parent uses an int PK so it always matches on re-save; only the child's
    // bigint PK exercises the string/number mismatch that nulled the FK.
    @PrimaryColumn({ type: "int" })
    id: number

    @OneToMany(() => Child, (child) => child.parent, { cascade: true })
    children: Child[]
}
