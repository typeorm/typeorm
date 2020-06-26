import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("sample19_post_metadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    comment: string;

}
