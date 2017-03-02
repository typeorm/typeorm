import {Column, Entity} from "../../../src/index";
import {ObjectIdColumn} from "../../../src/decorator/columns/ObjectIdColumn";
import {ObjectID} from "mongodb";

@Entity("sample34_post")
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column("int", {
        nullable: false
    })
    likesCount: number;

}