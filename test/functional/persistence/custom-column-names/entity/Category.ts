import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Post } from "./Post"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { CategoryMetadata } from "./CategoryMetadata"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany((type) => Post, (post) => post.category)
    posts: Post[]

    @Column({ type: "int", nullable: true })
    metadataId: number

    @OneToOne((type) => CategoryMetadata, (metadata) => metadata.category, {
        cascade: ["insert"],
    })
    @JoinColumn({ name: "metadataId" })
    metadata: CategoryMetadata

    @Column()
    name: string
}
