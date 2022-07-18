import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Category } from "./Category"
import { Generated } from "typeorm/decorator/Generated"

@Entity()
export class Post {
    @PrimaryColumn({ name: "theId" })
    @Generated()
    id: number

    @Column()
    title: string

    @ManyToOne((type) => Category, (category) => category.posts, {
        cascade: ["insert"],
    })
    category: Category
}
