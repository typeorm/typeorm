import { Column, Entity, OneToMany, PrimaryColumn } from "../../../../src";
import { SubjectStudent } from "./SubjectStudent.entity";

@Entity("subjects")
export class Subject {

    @PrimaryColumn()
    id!: string;

    @Column()
    name!: string;

    @OneToMany(() => SubjectStudent, subjectStudents => subjectStudents.subject)
    subjectStudents!: SubjectStudent[];

    constructor(
        id: string,
        name: string,
    ) {
        this.id = id;
        this.name = name;
    }

}
