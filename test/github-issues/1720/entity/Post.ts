import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    private _categories: Category[];

    @ManyToMany(() => Category)
    @JoinTable()
    get categories() {
        return this._categories;
    }

    set categories(arr) {
        this._categories = arr;
    }


}
