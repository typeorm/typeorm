import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Student } from "./Student";

@Entity()
export class Faculty {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Student, student => student.faculties)
    student: Student;

}
