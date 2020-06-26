import {Column, Entity, PrimaryGeneratedColumn} from "@typeorm/core";

@Entity("sample3_post_category")
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
