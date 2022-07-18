import { ChildEntity } from "../../typeorm/decorator/entity/ChildEntity"
import { OneToMany } from "../../typeorm/decorator/relations/OneToMany"
import { Person } from "./Person"
import { Faculty } from "./Faculty"

@ChildEntity()
export class Student extends Person {
    @OneToMany((type) => Faculty, (faculty) => faculty.student)
    faculties: Faculty[]
}
