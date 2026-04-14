import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Category {
    @PrimaryColumn("bigint")
    id: string

    @Column()
    name: string
}
