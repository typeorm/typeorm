import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { RegExpStringTransformer } from "./RegExpStringTransformer";

@Entity()
export class Foo {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: String, transformer: RegExpStringTransformer})
    bar: RegExp;
}
