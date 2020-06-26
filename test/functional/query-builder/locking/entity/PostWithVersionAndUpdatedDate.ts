import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from "@typeorm/core";

@Entity("post_with_v_ud")
export class PostWithVersionAndUpdatedDate {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @VersionColumn()
    version: number;

    @UpdateDateColumn()
    updateDate: Date;

}
