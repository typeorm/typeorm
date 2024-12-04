import { Column, Entity } from "../../../src/index"
import { PrimaryColumn } from "../../../src/decorator/columns/PrimaryColumn"
import { Generated } from "../../../src/decorator/Generated"

@Entity("sample35_post")
export class Post {
    @PrimaryColumn()
    @Generated()
    id: number

    @Column()
    title: string

    @Column()
    text: string

    @Column({ nullable: false })
    likesCount: number
}
