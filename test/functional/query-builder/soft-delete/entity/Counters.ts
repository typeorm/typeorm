import { Column, DeleteDateColumn } from "@typeorm/core";

export class Counters {

    @Column({default: 1})
    likes: number;

    @Column({nullable: true})
    favorites: number;

    @Column({default: 0})
    comments: number;

    @DeleteDateColumn()
    deletedAt: Date;
}
