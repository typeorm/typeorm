import { Entity, Column, PrimaryGeneratedColumn } from "../../../../src"

@Entity({ name: "foo", schema: "SYSTEM" })
export class Foo {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "string", default: "string" })
    string: number

    @Column({ name: "number", default: 1 })
    number: number

    @Column({ name: "boolean", default: true })
    boolean: number

    @Column({ name: "date", default: Date.now })
    date: number

    @Column({ name: "function_string", default: () => "function" })
    functionString: string
}
