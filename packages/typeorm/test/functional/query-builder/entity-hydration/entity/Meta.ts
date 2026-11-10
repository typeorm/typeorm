import { Column } from "../../../../../src"

export class Counters {
    @Column()
    likes: number

    @Column({ type: Number, nullable: true })
    stars: number | null
}

export class Meta {
    @Column()
    slug: string

    @Column(() => Counters)
    counters: Counters
}
