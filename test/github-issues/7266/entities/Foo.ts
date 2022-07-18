import { PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm"

import { Entity } from "typeorm/decorator/entity/Entity"

@Entity("foo")
export class Foo {
    @PrimaryGeneratedColumn({ name: "id" })
    id: number

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date
}
