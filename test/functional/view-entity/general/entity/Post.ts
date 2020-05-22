import {Entity} from "../../../../../src";
import {Column} from "../../../../../src";
import {PrimaryGeneratedColumn} from "../../../../../src";
import {ManyToOne} from "../../../../../src";
import {JoinColumn} from "../../../../../src";
import {Category} from "./Category";

@Entity()
export class Post {

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
