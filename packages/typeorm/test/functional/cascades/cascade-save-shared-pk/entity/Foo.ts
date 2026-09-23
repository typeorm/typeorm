import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Bar } from "./Bar"

@Entity()
export class Foo {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @PrimaryColumn()
    barId: number

    @Column()
    text: string

    @OneToOne(() => Bar, (b) => b.foo)
    @JoinColumn({ name: "barId", referencedColumnName: "id" })
    bar: Bar

    @CreateDateColumn()
    d: Date
}
