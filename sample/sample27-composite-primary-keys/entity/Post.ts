import { Column, Entity } from "../../../src/index"
import { PrimaryColumn } from "../../../src/decorator/columns/PrimaryColumn"

@Entity("sample27_composite_primary_keys")
export class Post {
    @PrimaryColumn("int")
    id: number

    @PrimaryColumn()
    type: string

    @Column()
    text: string
}
