import { Column, Entity, ManyToOne } from "../../../../src";
import { Student } from "./Student.entity";
import { Subject } from "./Subject.entity";

@Entity("students_subjects")
export class SubjectStudent {

    @ManyToOne(() => Subject, subject => subject.subjectStudents, { primary: true })
    subject!: Subject;

    @ManyToOne(() => Student, student => student.subjectStudents, { primary: true })
    student!: Student;

    @Column()
    mark!: number;

    constructor(
        subject: Subject,
        student: Student,
        mark: number,
    ) {
        this.subject = subject;
        this.student = student;
        this.mark = mark;
    }

}

