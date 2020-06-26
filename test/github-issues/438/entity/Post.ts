import { Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn({unsigned: true})
    id: number;

    @Column({zerofill: true})
    num: number;

}
