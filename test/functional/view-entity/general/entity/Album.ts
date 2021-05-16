import {Entity, JoinColumn, ManyToOne} from "../../../../../src";
import {Column} from "../../../../../src";
import {PrimaryGeneratedColumn} from "../../../../../src";
import {Category} from "./Category";

@Entity()
export class Album {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    categoryId: number;

    @ManyToOne(() => Category)
    @JoinColumn({ name: "categoryId" })
    category: Category;

}
