import { Column, Entity, ObjectIdColumn, UpdateDateColumn } from "@typeorm/core";
import { ObjectID } from "mongodb";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column()
    active: boolean = false;

    @UpdateDateColumn()
    updateDate: Date;

    @Column()
    updatedColumns: number | string[] = 0;

    loaded: boolean = false;
}
