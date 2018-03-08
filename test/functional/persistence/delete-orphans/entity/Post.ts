import {Category} from "./Category";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";
import { OrphanedRowAction } from "../../../../../src/decorator/options/OrphanedRowAction";

@Entity("post", { schema: "something" })
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    categoryId: string;

    @ManyToOne(type => Category, category => category.posts, { orphanedRowAction: OrphanedRowAction.Delete })
    @JoinColumn({ name: "categoryId" })
    category: Category;

}
