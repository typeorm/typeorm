import { Entity, Column, PrimaryGeneratedColumn } from "../../../../src"

@Entity({ name: "users" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    age: number

    @Column("jsonb")
    updated: { at: Date; by: number; obs: string }[]
}
