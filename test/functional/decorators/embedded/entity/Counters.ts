import { Column } from "typeorm/decorator/columns/Column"

export class Counters {
    @Column()
    likes: number

    @Column()
    comments: number

    @Column()
    favorites: number
}
