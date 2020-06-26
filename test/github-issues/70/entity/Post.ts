import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(() => Category, category => category.post, {
        cascade: ["insert"]
    })
    categories: Category[];

}
