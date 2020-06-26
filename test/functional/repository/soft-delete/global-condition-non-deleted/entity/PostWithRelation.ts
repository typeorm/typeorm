import { Column, DeleteDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { CategoryWithRelation } from "./CategoryWithRelation";

@Entity()
export class PostWithRelation {


    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => CategoryWithRelation, category => category.post, {eager: true})
    @JoinColumn()
    category: CategoryWithRelation;

    @DeleteDateColumn()
    deletedAt: Date;
}
