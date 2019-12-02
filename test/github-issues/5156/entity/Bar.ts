import { Entity } from "../../../../src/decorator/entity/Entity";
import { OneToMany } from "../../../../src";
import { Foo } from "./Foo";

@Entity()
export class Bar {
    @OneToMany(() => Foo, async ({ bar }) => bar)
    public foos: Foo[];
}



