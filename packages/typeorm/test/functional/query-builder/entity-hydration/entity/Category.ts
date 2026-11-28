import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Category {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
