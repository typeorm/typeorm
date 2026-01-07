import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

enum FooEnumWithSpecialChars {
    SIMPLE = "simple",
    WITH_QUOTE = "user's choice",
    WITH_MULTIPLE_QUOTES = "say 'hello' there",
}

@Entity()
export class FooWithSpecialChars {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "simple-enum",
        enum: FooEnumWithSpecialChars,
    })
    bar: FooEnumWithSpecialChars
}
