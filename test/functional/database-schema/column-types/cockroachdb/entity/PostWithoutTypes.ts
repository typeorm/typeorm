import { Entity } from "typeorm"
import { PrimaryColumn } from "typeorm"
import { Column } from "typeorm"

@Entity()
export class PostWithoutTypes {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column()
    boolean: boolean

    @Column()
    datetime: Date
}
