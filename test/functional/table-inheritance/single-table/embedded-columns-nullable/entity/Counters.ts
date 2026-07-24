import { Column } from "../../../../../../src/decorator/columns/Column"

export class Counters {
    @Column({ nullable: false })
    likes: number

    @Column({ nullable: false })
    comments: number

    @Column({ nullable: false })
    favorites: number
}
