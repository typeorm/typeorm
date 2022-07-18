import { Column } from "../../typeorm/decorator/columns/Column"
import { PrimaryColumn } from "../../typeorm/decorator/columns/PrimaryColumn"
import { OneToOne } from "../../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../../typeorm/decorator/relations/JoinColumn"
import { User } from "./User"

export class Subcounters {
    @PrimaryColumn()
    version: number

    @Column()
    watches: number

    @OneToOne((type) => User)
    @JoinColumn()
    watchedUser: User

    watchedUserId: number
}
