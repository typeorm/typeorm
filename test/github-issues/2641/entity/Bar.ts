import {Column, PrimaryGeneratedColumn, ManyToOne} from "../../../../src";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {Foo} from "./Foo";

@Entity()
export class Bar {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @ManyToOne(() => Foo, foo => foo.bar)
    public foo: Foo;
}
