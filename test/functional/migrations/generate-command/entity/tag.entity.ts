import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { Entity } from "typeorm/decorator/entity/Entity"
import { BaseEntity } from "typeorm/repository/BaseEntity"
import { Column } from "typeorm/decorator/columns/Column"
import { Post } from "./post.entity"

@Entity("tag_test")
export class Tag extends BaseEntity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Post)
    @JoinColumn({ name: "tag_to_post" })
    posts: Post | null
}
