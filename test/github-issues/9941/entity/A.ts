import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class A {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("timestamp with time zone")
    date: Date
}
