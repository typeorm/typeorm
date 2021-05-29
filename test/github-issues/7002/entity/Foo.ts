import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
} from "../../../../src";
import { Bar } from "./Bar";

@Entity()
export class Foo {
    @PrimaryColumn()
    id: number;

    @Column()
    text: string;

    @OneToOne(() => Bar, b => b.foo, { primary: true })
    @JoinColumn({ name: "id", referencedColumnName: "id" })
    bar: Bar;

    @CreateDateColumn()
    d: Date;
}
