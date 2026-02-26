import { Column } from "../../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { Person } from "./Person"
import { StudentCard } from "./StudentCard"

/**
 * Student is a sibling of Employee — they share the same parent (Person).
 * Student should NOT get Employee's or Teacher's eager relations.
 */
@ChildEntity()
export class Student extends Person {
    @Column()
    grade: number

    @OneToOne(() => StudentCard, { eager: true, nullable: true })
    @JoinColumn()
    card: StudentCard
}
