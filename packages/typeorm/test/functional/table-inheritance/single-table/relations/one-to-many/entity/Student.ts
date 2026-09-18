import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { OneToMany } from "../../../../../../../src/decorator/relations/OneToMany"
import { Person } from "./Person"
import { Faculty } from "./Faculty"

@ChildEntity()
export class Student extends Person {
    @OneToMany(() => Faculty, (faculty) => faculty.student)
    faculties: Faculty[]
}
