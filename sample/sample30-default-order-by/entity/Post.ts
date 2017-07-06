import { PrimaryGeneratedColumn, Column, Entity, CreateDateColumn, UpdateDateColumn } from "../../../src/index";
import { ManyToMany } from "../../../src/decorator/relations/ManyToMany";
import { Category } from "./Category";
import { JoinTable } from "../../../src/decorator/relations/JoinTable";

@Entity("sample30_post", {
    orderBy: {
        id: "DESC",
        createdDate: "DESC"
    }
})
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

    @CreateDateColumn()
    createdDate: Date;

    @UpdateDateColumn()
    updatedDate: Date;

    constructor(title: string, text: string, categories: Category[]) {
        this.title = title;
        this.text = text;
        this.categories = categories;
    }

}