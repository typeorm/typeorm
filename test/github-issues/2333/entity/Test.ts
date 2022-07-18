import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("test")
export class Test {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "datetime", nullable: true, default: null })
    publish_date: Date
}
