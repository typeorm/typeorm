import { Column, Entity, OneToMany, PrimaryColumn } from "../../../../../src"
import { Note } from "./Note"

/**
 * Composite primary key, so hydration has to group rows by more than one column.
 */
@Entity()
export class Enrollment {
    @PrimaryColumn()
    studentId: number

    @PrimaryColumn()
    courseId: number

    @Column()
    grade: string

    @OneToMany(() => Note, (note) => note.enrollment)
    notes: Note[]
}
