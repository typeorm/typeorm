import { Entity, PrimaryColumn, Column } from "../../../../../src"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
