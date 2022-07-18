import { Column, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm/decorator/entity/Entity"
import { Bar } from "./Bar"

@Entity("foo")
export class Foo {
    @PrimaryGeneratedColumn() id: number

    @Column({ default: "foo description" }) description: string

    @OneToMany(() => Bar, (bar) => bar.foo, { cascade: true, eager: true })
    bars?: Bar[]
}
