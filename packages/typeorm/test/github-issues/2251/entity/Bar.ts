import { Column, ManyToOne, PrimaryGeneratedColumn } from "../../../../src"
import { Entity } from "../../../../src/decorator/entity/Entity"
import { Foo } from "./Foo"

@Entity()
export class Bar {
    @PrimaryGeneratedColumn() id: number

    @Column() description: string

    @ManyToOne(() => Foo, (foo) => foo.bars)
    foo?: Foo
}
