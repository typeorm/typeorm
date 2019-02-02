import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {Tree, TreeChildren, TreeParent} from "../../../../src";

@Entity()
@Tree("materialized-path")
export class Category {
    @Column("integer", { generated: true, nullable: false, primary: true })
    id: number;

    @Column("text")
    title: string;

    @TreeParent()
    parent: Promise<Category>;

    @TreeChildren()
    children: Promise<Category[]>;
}
