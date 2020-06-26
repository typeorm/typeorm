import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { Event } from "./Event";
import { ObjectID } from "mongodb";

@Entity()
export class User {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

    @Column(type => Event)
    events: Event[];

}
