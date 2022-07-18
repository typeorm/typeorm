import { PrimaryColumn } from "typeorm"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"

@Entity()
export class Foo {
    @PrimaryColumn()
    id: number

    @Column()
    bar: string
}
