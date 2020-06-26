import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity("sample27_composite_primary_keys")
export class Post {

    @PrimaryColumn("int")
    id: number;

    @PrimaryColumn()
    type: string;

    @Column()
    text: string;

}
