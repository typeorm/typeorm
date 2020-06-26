import { Column, Entity, Index, ObjectIdColumn } from "@typeorm/core";
import { Information } from "./Information";
import { ObjectID } from "mongodb";

@Entity()
@Index("info_description", ["info.description"])
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    name: string;

    @Column(() => Information)
    info: Information;

}
