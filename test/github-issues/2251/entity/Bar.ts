import { Column, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Foo } from "./Foo"

@Entity()
export class Bar {
    @PrimaryGeneratedColumn() id: number

    @Column() description: string

    @ManyToOne((type) => Foo, (foo) => foo.bars)
    foo?: Foo
}
