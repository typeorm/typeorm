import { BeforeInsert, BeforeUpdate, Column } from "@typeorm/core";
import { PostCounter } from "./PostCounter";

export class PostInformation {

    @Column({nullable: true})
    description?: string;

    @Column(type => PostCounter, {prefix: "counters"})
    counters?: PostCounter;

    @BeforeInsert()
    beforeInsert() {
        this.description = "default post description";
    }

    @BeforeUpdate()
    beforeUpdate() {
        this.description = "default post description";
    }

}
