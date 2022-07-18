import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { Category } from "./Category"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { PostMetadata } from "./PostMetadata"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne((type) => Category, { cascade: true })
    @JoinColumn()
    category: Category | null

    @OneToOne((type) => PostMetadata, (metadata) => metadata.post, {
        cascade: true,
    })
    @JoinColumn()
    metadata: PostMetadata | null
}
