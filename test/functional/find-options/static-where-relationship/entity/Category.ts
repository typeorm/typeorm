import { BaseEntity, Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Category extends BaseEntity {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @Column({ type: "date", nullable: true })
    deletedAt: Date | null
}
