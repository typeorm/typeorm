import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 50 })
    name: string
}
