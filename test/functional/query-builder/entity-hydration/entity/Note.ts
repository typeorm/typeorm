import { Column, Entity, ManyToOne, PrimaryColumn } from "../../../../../src"
import { Enrollment } from "./Enrollment"

@Entity()
export class Note {
    @PrimaryColumn()
    id: number

    @Column()
    text: string

    @ManyToOne(() => Enrollment, (enrollment) => enrollment.notes, {
        nullable: true,
    })
    enrollment: Enrollment
}
