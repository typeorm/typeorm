import { Column } from "@typeorm/core";

export class FooChildMetadata {

    @Column({nullable: true})
    something: number;

    @Column({nullable: true})
    somethingElse: number;

}
