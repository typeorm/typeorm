import { Column } from "../../typeorm/decorator/columns/Column"
import { ManyToMany } from "../../typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "../../typeorm/decorator/relations/JoinTable"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { User } from "./User"

export class Subcounters {
    @PrimaryColumn()
    version: number

    @Column()
    watches: number

    @ManyToMany((type) => User, (user) => user.posts)
    @JoinTable({ name: "subcnt_users" })
    watchedUsers: User[]

    watchedUserIds: number[]
}
