import {
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    Entity,
} from "../../../../src"
import { Subject } from "./Subject"

@Entity()
export class Professor {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Subject, (subject) => subject.professor)
    subjects: Subject[]

    @OneToMany(() => Subject, (subject) => subject.assistant)
    assistedSubjects: Subject[]
}
