import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { ObjectID } from "mongodb";

@Entity()
export class Event {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    name: string;

    @Column({name: "at_date", default: Date.now})
    date: Date;

    // @Column( type => User)
    // participants: User[]
}
