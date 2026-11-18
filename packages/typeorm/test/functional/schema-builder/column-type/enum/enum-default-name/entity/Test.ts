import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../../src"

enum TestType {
    A = "A",
    B = "B",
}

@Entity({ name: "test" })
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "enum", enum: TestType, enumName: "test_type_enum" })
    type: TestType

    @Column({
        type: "enum",
        enum: TestType,
        enumName: "test_types_enum",
        array: true,
    })
    types: TestType[]
}
