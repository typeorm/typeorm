import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class BracketTag {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({ name: "code[", type: "varchar" })
    codeBracket: string
}
