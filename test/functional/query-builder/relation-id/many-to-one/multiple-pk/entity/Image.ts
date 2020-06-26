import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Category, category => category.image)
    categories: Category[];

    categoryIds: number[];

}
