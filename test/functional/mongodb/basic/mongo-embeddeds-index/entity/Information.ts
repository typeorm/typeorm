import { Column, Index } from "@typeorm/core";

export class Information {

    @Column()
    description: string;

    @Column()
    @Index("post_likes")
    likes: number;

}
