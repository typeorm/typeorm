import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { ObjectID } from "mongodb";

@Entity()
export class User {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    name: string;

}
