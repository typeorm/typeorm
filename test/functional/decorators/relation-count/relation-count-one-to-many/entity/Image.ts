import { Column, Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Image {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToOne(type => Category, category => category.images)
    category: Category;

}
