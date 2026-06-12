import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ unique: true })
    email: string
}
