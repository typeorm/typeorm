import * as cls from "continuation-local-storage";
cls.createNamespace("foo");

import { Entity } from "../../../../src/decorator/entity/Entity";
import { ManyToOne } from "../../../../src";
import { Bar } from "./Bar";

@Entity()
export class Foo {
    @ManyToOne(() => Bar, ({ foos }) => foos)
    public bar: Promise<Bar>;
}
