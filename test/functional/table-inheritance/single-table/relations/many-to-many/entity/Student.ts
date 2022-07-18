import { ChildEntity } from "../../typeorm/decorator/entity/ChildEntity"
import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { Person } from "./Person"
import { Faculty } from "./Faculty"
import { JoinTable } from "../../typeorm/decorator/relations/JoinTable"

@ChildEntity()
export class Student extends Person {
    @ManyToMany((type) => Faculty, (faculty) => faculty.students)
    @JoinTable()
    faculties: Faculty[]
}
