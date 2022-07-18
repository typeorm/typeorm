import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn()
    name: string

    @PrimaryColumn()
    email: string

    @Column()
    age: number
}
