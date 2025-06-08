import { Entity, PrimaryColumn } from "../../../../src"

@Entity()
export class A {
    @PrimaryColumn()
    id: number
}
