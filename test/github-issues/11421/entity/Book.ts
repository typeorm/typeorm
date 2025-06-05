/* eslint-disable @typescript-eslint/no-explicit-any */
import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Book {
    @PrimaryGeneratedColumn("uuid")
    public readonly id: string

    @Column({ nullable: true })
    public name: string

    @Column({ nullable: true })
    public genre: string

    @Column({ nullable: true })
    public author: string
}
