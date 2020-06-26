import { Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Book {

    @PrimaryColumn()
    ean: string;

}

@Entity({withoutRowid: true})
export class Book2 {

    @PrimaryColumn()
    ean: string;

}

