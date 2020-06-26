import {Column, Entity} from "@typeorm/core";
import {PrimaryColumn} from "@typeorm/core";
import {Generated} from "@typeorm/core";

@Entity("sample01_post")
export class Post {

    @PrimaryColumn("integer")
    @Generated()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column({ nullable: false })
    likesCount: number;

}
