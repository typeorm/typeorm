import { Column } from "../../../../../src/decorator/columns/Column"
import { AfterLoad } from "../../../../../src/decorator/listeners/AfterLoad"
import { BeforeInsert } from "../../../../../src/decorator/listeners/BeforeInsert"
import { BeforeUpdate } from "../../../../../src/decorator/listeners/BeforeUpdate"
import { Index } from "../../../../../src/decorator/Index"

@Index(["likes", "favorites"])
export class PostCounter {
    @Column()
    likes: number

    @Column()
    favorites: number

    @Column()
    comments: number

    loaded = false

    @BeforeInsert()
    beforeInsert() {
        this.likes = 0
        this.favorites = 0
        this.comments = 0
    }

    @BeforeUpdate()
    beforeUpdate() {
        this.likes++
        this.favorites++
        this.comments++
    }

    @AfterLoad()
    async afterLoad() {
        await new Promise((resolve) => setTimeout(resolve, 10))
        this.loaded = true
    }
}
