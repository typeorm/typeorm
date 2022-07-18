import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { BaseEntity } from "typeorm/repository/BaseEntity"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { Foo } from "./Foo"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"

@Entity()
export class Bar extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne((type) => Foo, {
        onDelete: "SET NULL",
    })
    @JoinColumn()
    foo: Foo
}
