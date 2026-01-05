import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

enum FooEnum {
    VALUE1 = "value1",
    VALUE2 = "value2",
    VALUE3 = "value3",
}

@Entity()
export class Foo {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "simple-enum",
        enum: FooEnum,
    })
    bar: FooEnum
}
