import { Column, Entity, ManyToMany, PrimaryColumn, RelationCount } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Image {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    isRemoved: boolean = false;

    @ManyToMany(type => Category, category => category.images)
    categories: Category[];

    @RelationCount((image: Image) => image.categories)
    categoryCount: number;

}
