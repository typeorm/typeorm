import {
    Column,
    ManyToOne,
    PrimaryGeneratedColumn,
    Entity,
} from "../../../../src"
import { Professor } from "./Professor"

@Entity()
export class Subject {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Professor, (professor) => professor.subjects)
    professor: Professor

    @ManyToOne(() => Professor, (professor) => professor.assistedSubjects)
    assistant: Professor
}
