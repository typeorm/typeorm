import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { User } from "./User"

export class Subcounters {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    version: number

    @Column()
    watches: number

    @ManyToOne((type) => User)
    watchedUser: User

    watchedUserId: number
}
