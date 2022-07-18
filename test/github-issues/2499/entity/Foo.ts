import { Column, PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity("foo")
export class Foo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    description: string
}
