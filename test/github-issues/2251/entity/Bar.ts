import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Foo } from "./Foo";

@Entity()
export class Bar {
    @PrimaryGeneratedColumn() id: number;

    @Column() description: string;

    @ManyToOne(type => Foo, foo => foo.bars)
    foo?: Foo;
}
