import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Teacher } from "./Teacher";

@Entity()
export class Specialization {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToMany(type => Teacher, teacher => teacher.specializations)
    teachers: Teacher[];

}
