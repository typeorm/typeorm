import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

enum TestEnum {
    value1 = "value1",
    value2 = "value2",
}

@Entity({
    name: "example",
})
export class Example {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "enum",
        enum: TestEnum,
        enumName: "example_status_enum",
        name: "status",
    })
    status: TestEnum
}
