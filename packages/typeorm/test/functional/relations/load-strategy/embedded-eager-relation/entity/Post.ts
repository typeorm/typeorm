import { Column } from "../../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Image } from "./Image"
import { Meta } from "./Meta"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Image, { nullable: true })
    image: Image | null

    @Column(() => Meta)
    meta: Meta
}
