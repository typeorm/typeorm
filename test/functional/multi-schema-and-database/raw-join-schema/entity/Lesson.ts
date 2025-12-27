import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity({ schema: "myschema" })
export class Lesson {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    courseId: string

    @Column()
    duration: number
}
