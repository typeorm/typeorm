import { Column } from "typeorm/decorator/columns/Column"

export class FooChildMetadata {
    @Column({ nullable: true })
    something: number

    @Column({ nullable: true })
    somethingElse: number
}
