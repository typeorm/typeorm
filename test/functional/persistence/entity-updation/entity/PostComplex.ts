import { Column, Entity, PrimaryColumn } from "@typeorm/core";
import { PostEmbedded } from "./PostEmbedded";

@Entity()
export class PostComplex {

    @PrimaryColumn()
    firstId: number;

    @Column({default: "Hello Complexity"})
    text: string;

    @Column(type => PostEmbedded)
    embed: PostEmbedded;

}
