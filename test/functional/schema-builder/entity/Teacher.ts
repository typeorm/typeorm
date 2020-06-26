import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Student } from "./Student";

@Entity()
@Index("ignored_index", {synchronize: false})
export class Teacher {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Student, student => student.teacher)
    students: Student[];

}
