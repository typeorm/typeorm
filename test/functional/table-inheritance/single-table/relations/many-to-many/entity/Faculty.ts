import { Column } from "../../typeorm/decorator/columns/Column"
import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { Student } from "./Student"

@Entity()
export class Faculty {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Student, (student) => student.faculties)
    students: Student[]
}
