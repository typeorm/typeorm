import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Faculty } from "./Faculty"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Teacher } from "./Teacher"
import { Index } from "typeorm/decorator/Index"

@Entity()
@Index("student_name_index", ["name"])
export class Student {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Faculty)
    faculty: Faculty

    @ManyToOne((type) => Teacher)
    teacher: Teacher
}
