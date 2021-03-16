import {Entity, Column, PrimaryColumn} from "../../../../src";

@Entity()
export class Post {

    @PrimaryColumn({"type": "int"})
    id: number;

    @Column({type: "text"})
    owner: string;

}