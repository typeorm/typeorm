import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class Example {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}