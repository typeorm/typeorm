import { Column } from "../../typeorm/decorator/columns/Column"
import { OneToOne } from "../../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../../typeorm/decorator/relations/JoinColumn"
import { PrimaryGeneratedColumn } from "../../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { User } from "./User"

export class Subcounters {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    version: number

    @Column()
    watches: number

    @OneToOne((type) => User)
    @JoinColumn()
    watchedUser: User

    watchedUserId: number
}
