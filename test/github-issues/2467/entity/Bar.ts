import { Foo } from "./Foo";
import { Entity, ManyToOne, Column, PrimaryGeneratedColumn } from "../../../../src";

@Entity()
export class Bar {
    @PrimaryGeneratedColumn()
    barId: number;

    @ManyToOne(() => Foo, foo => foo.bars, { nullable: false })
    foo: Foo;

    @Column()
    name: string;
}