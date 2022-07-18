import { Column } from "typeorm/decorator/columns/Column"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { User } from "./User"
import { Subcounters } from "./Subcounters"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

export class Counters {
    @PrimaryColumn()
    code: number

    @Column()
    likes: number

    @Column()
    comments: number

    @Column()
    favorites: number

    @Column(() => Subcounters, { prefix: "subcnt" })
    subcounters: Subcounters

    @ManyToOne((type) => User)
    @JoinColumn()
    likedUser: User
}
