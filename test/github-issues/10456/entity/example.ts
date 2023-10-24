import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity()
export class Example {
    @PrimaryColumn()
    id: number

    @Column({ type: "jsonpath" })
    path: string
}
