import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Foo {
    @PrimaryColumn()
    id1: number

    @PrimaryColumn()
    id2: number
}
