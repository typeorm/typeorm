import { Column } from "../../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { Employee } from "./Employee"
import { TeacherCertificate } from "./TeacherCertificate"

@ChildEntity()
export class Teacher extends Employee {
    @Column()
    subject: string

    @OneToOne(() => TeacherCertificate, { eager: true, nullable: true })
    @JoinColumn()
    certificate: TeacherCertificate
}
