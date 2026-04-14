import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { Person } from "./Person"
import { StudentSettings } from "./StudentSettings"

@ChildEntity()
export class Student extends Person {
    @OneToOne(() => StudentSettings, { eager: true, nullable: true })
    @JoinColumn()
    settings: StudentSettings
}
