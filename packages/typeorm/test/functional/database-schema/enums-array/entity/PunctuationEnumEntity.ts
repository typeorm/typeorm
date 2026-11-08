import { Entity, Column, PrimaryColumn } from "../../../../../src"

export enum PunctuationEnum {
    Comma = "a,b",
    CommaAndSpace = "c, d",
    NullWord = "NULL",
}

@Entity()
export class PunctuationEnumEntity {
    @PrimaryColumn()
    id: number

    @Column({
        type: "enum",
        enum: PunctuationEnum,
        array: true,
    })
    values: (PunctuationEnum | null)[]
}
