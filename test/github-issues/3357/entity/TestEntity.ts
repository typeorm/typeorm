import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ length: 50 })
    name: string
}
