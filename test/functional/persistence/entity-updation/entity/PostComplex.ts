import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { PostEmbedded } from "./PostEmbedded"
import { PrimaryColumn } from "typeorm/decorator/columns/PrimaryColumn"

@Entity()
export class PostComplex {
    @PrimaryColumn()
    firstId: number

    @Column({ default: "Hello Complexity" })
    text: string

    @Column((type) => PostEmbedded)
    embed: PostEmbedded
}
