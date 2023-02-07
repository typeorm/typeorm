import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity("test")
export class Test {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "datetime", nullable: true, default: null })
    publish_date: Date
}
