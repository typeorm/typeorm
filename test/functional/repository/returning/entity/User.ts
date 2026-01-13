import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: number

    @Column()
    name: string
}
