import { BeforeInsert, BeforeUpdate, Column, Index } from "@typeorm/core";

@Index(["likes", "favorites"])
export class PostCounter {

    @Column()
    likes: number;

    @Column()
    favorites: number;

    @Column()
    comments: number;

    @BeforeInsert()
    beforeInsert() {
        this.likes = 0;
        this.favorites = 0;
        this.comments = 0;
    }

    @BeforeUpdate()
    beforeUpdate() {
        this.likes++;
        this.favorites++;
        this.comments++;
    }

}
