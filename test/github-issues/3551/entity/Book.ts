import { Column, Entity, ObjectIdColumn } from "@typeorm/core";
import { ObjectID } from "mongodb";

export class Page {
    @Column()
    number: number;
}

export class Chapter {
    @Column()
    title: string;

    @Column(type => Page)
    pages: Page[];
}

@Entity()
export class Book {
    @ObjectIdColumn()
    id: ObjectID;

    @Column()
    title: string;

    @Column(type => Chapter)
    chapters: Chapter[];
}
