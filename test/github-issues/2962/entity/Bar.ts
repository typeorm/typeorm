import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src/index.js"
import { Foo } from "./Foo"
import { Column } from "../../../../src"

@Entity()
export class Bar {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: false })
    isTrapazoidal: boolean

    @ManyToOne(() => Foo, (foo: Foo) => foo.bars, {
        nullable: false,
    })
    foo: Foo
}
