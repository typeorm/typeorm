import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src/index"

@Entity()
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", length: 100 })
    name: string
}
