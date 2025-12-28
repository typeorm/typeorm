import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Course {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    courseName: string

    @Column()
    duration: number
}
