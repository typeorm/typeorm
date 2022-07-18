import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { JoinColumn } from "typeorm"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"
import { Post } from "./Post"

@Entity()
export class PostVersion {
    @PrimaryColumn()
    id: number

    @ManyToOne((type) => Post)
    @JoinColumn({ referencedColumnName: "version" })
    post: Post

    @Column()
    details: string
}
