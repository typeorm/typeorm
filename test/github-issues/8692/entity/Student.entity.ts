import { Column, Entity, OneToMany, PrimaryColumn } from "../../../../src";
import { SubjectStudent } from "./SubjectStudent.entity";

@Entity("students")
export class Student {

    @PrimaryColumn()
    id!: string;

    @Column()
    name!: string;

    @OneToMany(() => SubjectStudent, subjectStudents => subjectStudents.student)
    subjectStudents!: SubjectStudent[];

    constructor(
        id: string,
        name: string,
    ) {
        this.id = id;
        this.name = name;
    }

}

