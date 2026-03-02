import { Column } from "../../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { OneToMany } from "../../../../../../../src/decorator/relations/OneToMany"
import { Actor } from "./Actor"
import { Department } from "./Department"

@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    @OneToMany(() => Department, (dept) => dept.organization)
    departments: Department[]
}
