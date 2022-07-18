import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class TestEntity {
    @PrimaryGeneratedColumn()
    id: number
}
