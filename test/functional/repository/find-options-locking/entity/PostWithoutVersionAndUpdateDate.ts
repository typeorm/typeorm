import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity("post_without_v_ud")
export class PostWithoutVersionAndUpdateDate {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

}
