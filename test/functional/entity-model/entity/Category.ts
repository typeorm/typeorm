import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Category extends BaseEntity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
