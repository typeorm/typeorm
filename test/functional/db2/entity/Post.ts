import { Entity } from "../../../../src/decorator/entity/Entity";
import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { OneToMany } from "../../../../src/decorator/relations/OneToMany";
import { Category } from "./Category";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    title: string;

    @Column("text")
    description: string;

    @Column("text")
    subtitle: string;

    @OneToMany((type) => Category, (category) => category.post, {
        cascade: ["insert"],
    })
    categories?: Category[];

    @Column({ nullable: true })
    isNew: boolean;
}
