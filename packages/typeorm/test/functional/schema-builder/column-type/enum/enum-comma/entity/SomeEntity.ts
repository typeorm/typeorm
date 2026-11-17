import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "../../../../../../../src"

export enum Choice {
    Comma = "a,b",
    CommaAndSpace = "c, d",
    Apostrophe = "it's",
}

@Entity()
export class SomeEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "enum", enum: Choice })
    choice: Choice
}
