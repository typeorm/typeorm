import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "@typeorm/core";
import { PostCategory } from "./PostCategory";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({default: false})
    active: boolean;

    @UpdateDateColumn()
    updateDate: Date;

    @OneToOne(type => PostCategory)
    @JoinColumn()
    category: PostCategory;

    @Column()
    updatedColumns: number = 0;

    @Column()
    updatedRelations: number = 0;
}
