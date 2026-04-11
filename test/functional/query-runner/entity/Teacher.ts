import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"
import { Student } from "./Student"

@Entity()
export class Teacher {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Student, (student) => student.teacher)
    students: Student[]
}
