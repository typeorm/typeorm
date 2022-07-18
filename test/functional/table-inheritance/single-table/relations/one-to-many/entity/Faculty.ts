import { Column } from "../../typeorm/decorator/columns/Column"
import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "../../typeorm/decorator/relations/ManyToOne"
import { Student } from "./Student"

@Entity()
export class Faculty {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Student, (student) => student.faculties)
    student: Student
}
