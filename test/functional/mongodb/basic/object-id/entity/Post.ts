import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { ObjectID } from "mongodb";

@Entity()
export class Post {

    @ObjectIdColumn()
    nonIdNameOfObjectId: ObjectID;

    @Column()
    title: string;
}
