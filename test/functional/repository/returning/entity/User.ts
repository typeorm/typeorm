import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    name: string
}
