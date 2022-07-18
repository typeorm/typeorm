import { Column } from "typeorm/decorator/columns/Column"
import { BeforeInsert } from "typeorm/decorator/listeners/BeforeInsert"
import { BeforeUpdate } from "typeorm/decorator/listeners/BeforeUpdate"
import { Index } from "typeorm/decorator/Index"

@Index(["likes", "favorites"])
export class PostCounter {
    @Column()
    likes: number

    @Column()
    favorites: number

    @Column()
    comments: number

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
}
