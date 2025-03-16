import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity("user")
export class User {
    @PrimaryGeneratedColumn({ type: "int" })
    id: number

    @Column()
    name: string

    @Column()
    email: string
}
