import { Column } from "../../typeorm/decorator/columns/Column"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { User } from "./User"
import { ManyToOne } from "../../typeorm/decorator/relations/ManyToOne"

export class Subcounters {
    @PrimaryColumn()
    version: number

    @Column()
    watches: number

    @ManyToOne((type) => User)
    watchedUser: User

    watchedUserId: number
}
