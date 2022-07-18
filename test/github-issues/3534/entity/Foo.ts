import { Column } from "typeorm/decorator/columns/Column"
import { Entity } from "typeorm/decorator/entity/Entity"
import { RegExpStringTransformer } from "./RegExpStringTransformer"
import { PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Foo {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: String, transformer: RegExpStringTransformer })
    bar: RegExp
}
