import { Column, Entity, PrimaryColumn } from "../../../../src"

@Entity()
export class Human {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
