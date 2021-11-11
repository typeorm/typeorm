import {Entity, OneToMany, ManyToOne} from "../../../src";
import {Column} from "../../../src";
import {PrimaryGeneratedColumn} from "../../../src";
import { TableInheritance } from "../../../src";
import {ChildEntity} from "../../../src";
import {JoinColumn} from "../../../src";

@Entity()
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @Column()
    postId: number;

    @ManyToOne(
        () => Post,
        (entity) => entity.comments,
    )
    @JoinColumn({
        name: "postId",
    })
    post?: Post;

}

@Entity()
@TableInheritance({column: {type: "string", name: "postType"}})
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    postType: string = "BasePost";

    @OneToMany(() => Comment, (entity) => entity.post)
    comments?: Comment[];
}

@ChildEntity("TargetPost")
export class TargetPost extends Post {
    @Column()
    postType: string = "TargetPost";
}


