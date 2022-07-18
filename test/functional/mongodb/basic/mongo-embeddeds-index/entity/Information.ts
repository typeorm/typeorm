import { Column } from "../typeorm/decorator/columns/Column"
import { Index } from "../typeorm/decorator/Index"

export class Information {
    @Column()
    description: string

    @Column()
    @Index("post_likes")
    likes: number
}
