import {
    BaseEntity,
    Column,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../src"

import { Entity } from "../../../../src/decorator/entity/Entity"
import { Foo } from "./Foo"

@Entity()
export class Bar extends BaseEntity {
    @PrimaryGeneratedColumn() id: number

    @Column() description: string

    @ManyToMany(() => Foo, (foo) => foo.bars)
    foos?: Foo[]
}
