import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

export type Role = "sa" | "user" | "admin" | "server"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        length: 32,
        unique: true,
    })
    username: string

    @Column({
        nullable: true,
    })
    password: string

    @Column({
        nullable: true,
    })
    phone: string

    @Column("json")
    roles: Role[]

    @Column()
    lastLoginAt: Date
}
