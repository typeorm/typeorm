import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../../../src/decorator/relations/OneToOne";
import {Category} from "./Category";

@Entity()
export class Image {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Category, category => category.image)
    category: Category;

    categoryId: number;

}