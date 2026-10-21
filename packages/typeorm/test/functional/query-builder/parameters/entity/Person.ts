import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Person {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string
}
