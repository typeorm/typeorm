import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    category: string;

    @Column()
    text: string;

    @CreateDateColumn()
    createDate: Date;

    @UpdateDateColumn()
    updateDate: Date;

}
