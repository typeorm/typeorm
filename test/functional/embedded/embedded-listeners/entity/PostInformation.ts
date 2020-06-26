import { BeforeInsert, Column, Index } from "@typeorm/core";
import { PostCounter } from "./PostCounter";

export class PostInformation {

    @Column()
    @Index()
    description: string;

    @Column(type => PostCounter, {prefix: "counters"})
    counters: PostCounter = new PostCounter();

    @BeforeInsert()
    beforeInsert() {
        this.description = "default post description";
    }

}
