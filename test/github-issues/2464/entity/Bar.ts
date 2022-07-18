import { BaseEntity, Column, ManyToMany, PrimaryGeneratedColumn } from "typeorm"

import { Entity } from "typeorm/decorator/entity/Entity"
import { Foo } from "./Foo"

@Entity()
export class Bar extends BaseEntity {
    @PrimaryGeneratedColumn() id: number

    @Column() description: string

    @ManyToMany((type) => Foo, (foo) => foo.bars)
    foos?: Foo[]
}
