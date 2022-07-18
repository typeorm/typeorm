import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { FooMetadata } from "./FooMetadata"

@Entity()
export class Foo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column((type) => FooMetadata)
    metadata?: FooMetadata
}
