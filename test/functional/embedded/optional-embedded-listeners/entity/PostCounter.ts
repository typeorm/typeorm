import { BeforeInsert, BeforeUpdate, Column } from "@typeorm/core";

export class PostCounter {

    @Column({nullable: true})
    likes: number;

    @BeforeInsert()
    beforeInsert() {
        this.likes = 0;
    }

    @BeforeUpdate()
    beforeUpdate() {
        this.likes++;
    }

}
