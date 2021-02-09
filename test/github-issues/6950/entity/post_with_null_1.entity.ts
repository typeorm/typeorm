import { Category } from "../../../functional/migrations/generate-command/entity";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "../../../../src";
import "reflect-metadata";

@Entity("post_test", { schema: "public" })
export class Post extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({
        default: "This is default text."
    })
    text: string;

    @Column({
        default: null,
    })
    comments: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}
