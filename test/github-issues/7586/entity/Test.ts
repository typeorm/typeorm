import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar")
    type: string
}
