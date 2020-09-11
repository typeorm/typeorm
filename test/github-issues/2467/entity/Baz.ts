import { Foo } from "./Foo";
import { Entity, ManyToOne, Column, PrimaryGeneratedColumn } from "../../../../src";

@Entity()
export class Baz {
    @PrimaryGeneratedColumn()
    bazId: number;

    @ManyToOne(() => Foo, foo => foo.bazs, { nullable: true })
    foo: Foo;

    @Column()
    name: string;
}