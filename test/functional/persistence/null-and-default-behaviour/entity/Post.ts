import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column({type: String, default: "hello default value", nullable: true})
    title?: string | null;

}
