import { Entity, PrimaryColumn, Column } from "../../../../src"

@Entity()
export class User {
    @PrimaryColumn()
    name: string

    @PrimaryColumn()
    email: string

    @Column()
    age: number
}
