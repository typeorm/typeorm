import { Column } from "../../typeorm/decorator/columns/Column"
import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "../../typeorm/decorator/relations/JoinTable"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { User } from "./User"

export class Subcounters {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    version: number

    @Column()
    watches: number

    @ManyToMany((type) => User)
    @JoinTable({ name: "subcnt_users" })
    watchedUsers: User[]

    watchedUserIds: number[]
}
