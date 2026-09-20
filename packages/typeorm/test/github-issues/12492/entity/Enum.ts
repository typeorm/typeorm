import { Entity, Column, PrimaryColumn } from "../../../../src"

const enumDef = ["VALUE1", "VALUE2"] as const
type EnumDef = (typeof enumDef)[number]

@Entity()
export class SingleEnum {
    @PrimaryColumn()
    id: number

    @Column({
        type: "enum",
        enum: enumDef,
        enumName: "enum_def",
        nullable: false,
        array: false,
        default: () => "'VALUE2'::enum_def",
    })
    labels1: EnumDef

    @Column({
        type: "enum",
        enum: enumDef,
        enumName: "enum_def",
        nullable: false,
        array: true,
        default: () => "ARRAY[]::enum_def[]",
    })
    labels2: EnumDef[]
}
