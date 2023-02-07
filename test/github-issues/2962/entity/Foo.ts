import {
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../src/index.js"
import { Bar } from "./Bar"
import { Column } from "../../../../src"

@Entity()
export class Foo {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ default: false })
    hasStuff: boolean

    @OneToMany(() => Bar, (bar: Bar) => bar.foo, {
        cascade: true,
    })
    bars: Bar[]
}
