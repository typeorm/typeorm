import { Column } from "typeorm/decorator/columns/Column"
import { PostCounter } from "./PostCounter"
import { BeforeInsert } from "typeorm/decorator/listeners/BeforeInsert"
import { Index } from "typeorm/decorator/Index"

export class PostInformation {
    @Column()
    @Index()
    description: string

    @Column((type) => PostCounter, { prefix: "counters" })
    counters: PostCounter = new PostCounter()

    @BeforeInsert()
    beforeInsert() {
        this.description = "default post description"
    }
}
