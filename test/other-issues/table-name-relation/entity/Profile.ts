import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity("profiles")
export class Profile {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    gender: string

    @Column()
    photo: string
}
