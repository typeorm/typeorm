import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../src/decorator/relations/JoinColumn";
import {DeleteDateColumn} from "../../../../src";
import {Post} from "./Post";

@Entity()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    postId: string;

    @ManyToOne(() => Post, post => post.authors)
    @JoinColumn({ name: "postId" })
    post: Post;

    @DeleteDateColumn()
    deletedAt?: Date;
}
