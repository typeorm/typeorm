import { Column } from "typeorm/decorator/columns/Column"

export class Counters {
    @Column({ name: "_likes" })
    likes: number

    @Column({ name: "_comments" })
    comments: number

    @Column({ name: "_favorites" })
    favorites: number
}
