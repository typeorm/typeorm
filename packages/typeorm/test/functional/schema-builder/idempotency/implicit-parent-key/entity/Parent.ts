import { Column, Entity, PrimaryColumn } from "../../../../../../src"

@Entity()
export class Parent {
    @PrimaryColumn()
    id: number

    @Column()
    code: string
}
