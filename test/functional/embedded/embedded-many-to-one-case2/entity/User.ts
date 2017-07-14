import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";
import {Post} from "./Post";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Post)
    @JoinColumn()
    likedPost: Post;

}