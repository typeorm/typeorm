import { Entity } from "../../../../../src/decorator/entity/Entity"
import { Column } from "../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"

export class Counters {
    @Column({ select: false, nullable: true })
    secretCode?: string
}

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @Column({ select: false })
    authorName: string

    @Column(() => Counters)
    counters: Counters
}
