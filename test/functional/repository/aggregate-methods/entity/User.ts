import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    age: number

    @Column({ unique: true })
    username: string
}
