import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { Teacher } from "./Teacher"

@Entity()
export class Specialization {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany((type) => Teacher, (teacher) => teacher.specializations)
    teachers: Teacher[]
}
