import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {
    @PrimaryColumn()
    id: number;

    @Column({
        type: "simple-json",
        nullable: true
    })
    jsonField: any;

}
