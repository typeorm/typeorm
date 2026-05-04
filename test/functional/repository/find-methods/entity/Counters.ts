import { Column } from "../../../../../src/decorator/columns/Column"

export class Counters {
    @Column({ default: 0 })
    likes: number
}
