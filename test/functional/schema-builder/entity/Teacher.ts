import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Student } from "./Student"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Index } from "typeorm/decorator/Index"

@Entity()
@Index("ignored_index", { synchronize: false })
export class Teacher {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany((type) => Student, (student) => student.teacher)
    students: Student[]
}
