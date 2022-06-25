import { BaseEntity, Column, Entity, PrimaryColumn } from "../../../../src"

@Entity()
export class Item extends BaseEntity {
    @PrimaryColumn()
    id: string

    @Column()
    value: number
}
