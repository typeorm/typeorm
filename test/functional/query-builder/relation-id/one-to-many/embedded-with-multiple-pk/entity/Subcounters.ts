import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { User } from "./User"

export class Subcounters {
    @PrimaryColumn()
    version: number

    @Column()
    watches: number

    @OneToMany((type) => User, (user) => user.post)
    watchedUsers: User[]

    watchedUserIds: number[]
}
