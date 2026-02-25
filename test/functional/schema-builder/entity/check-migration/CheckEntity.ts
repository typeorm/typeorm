import { Column, Entity, PrimaryGeneratedColumn, Check } from "../../../../../src"

enum MyEnum {
    A = "A",
    B = "B",
    C = "C",
}

@Entity("check_entity")
@Check("CHK_composite", `"value" > 0 AND "enumValue" IN ('A', 'B', 'C')`)
export class CheckEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    @Check("CHK_value_positive", `"value" > 0 AND "value" < 100`)
    value: number

    @Column({ type: "text", enum: MyEnum })
    @Check("CHK_enum_value", `"enumValue" IN ('A', 'B', 'C')`)
    enumValue: MyEnum
}
