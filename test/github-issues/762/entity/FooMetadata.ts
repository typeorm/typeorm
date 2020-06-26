import { Column } from "@typeorm/core";
import { FooChildMetadata } from "./FooChildMetadata";

export class FooMetadata {

    @Column({nullable: true})
    bar: number;

    @Column(type => FooChildMetadata)
    child?: FooChildMetadata;

}
