import { Column } from "typeorm/decorator/columns/Column"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { PostWithRelation } from "./PostWithRelation"

@Entity()
export class CategoryWithRelation {
    @PrimaryColumn()
    id: number

    @Column({ unique: true })
    name: string

    @OneToOne((type) => PostWithRelation, (post) => post.category)
    post: PostWithRelation
}
