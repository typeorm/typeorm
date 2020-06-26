import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { ObjectID } from "mongodb";

@Entity()
export class PostWithUnderscoreId {

    @ObjectIdColumn()
    _id: ObjectID;

    @Column()
    title: string;
}
