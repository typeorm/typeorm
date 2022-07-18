import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn()
    email: string

    @PrimaryColumn()
    username: string

    @Column()
    bio: string
}
