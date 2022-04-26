import { Entity } from "../../../../../../src"
import { PrimaryColumn } from "../../../../../../src"
import { Column } from "../../../../../../src"

@Entity()
export class PostWithoutTypes {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    boolean: boolean

    @Column()
    blob: Buffer

    @Column()
    timestamp: Date
}
