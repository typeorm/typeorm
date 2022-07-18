import { Column } from "typeorm/decorator/columns/Column"
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
}
