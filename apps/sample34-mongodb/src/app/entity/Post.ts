import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { ObjectID } from 'mongodb';

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
