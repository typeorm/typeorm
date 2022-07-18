import { Entity } from "typeorm/decorator/entity/Entity"
import { ManyToOne, PrimaryColumn } from "typeorm"
import { Foo } from "./Foo"

@Entity()
export class Bar {
    @PrimaryColumn()
    id: number

    @ManyToOne((type) => Foo)
    foo: Foo
}
