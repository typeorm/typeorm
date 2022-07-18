import { Column } from "../../typeorm/decorator/columns/Column"
import { Entity } from "../../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "../../typeorm/decorator/relations/ManyToOne"
import { Teacher } from "./Teacher"

@Entity()
export class Specialization {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((type) => Teacher, (teacher) => teacher.specializations)
    teacher: Teacher
}
