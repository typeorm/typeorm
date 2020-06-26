import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { Counters } from "./Counters";
import { ObjectID } from "mongodb";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    text: string;

    @Column(type => Counters)
    counters?: Counters;

}
