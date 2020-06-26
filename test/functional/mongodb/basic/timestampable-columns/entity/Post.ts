import { Column, CreateDateColumn, Entity, ObjectIdColumn, UpdateDateColumn } from "@typeorm/core";
import { ObjectID } from "mongodb";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    message: string;

    @Column()
    @CreateDateColumn()
    createdAt: Date;

    @Column()
    @UpdateDateColumn()
    updatedAt: Date;
}
