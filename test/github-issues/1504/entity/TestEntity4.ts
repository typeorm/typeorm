import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm"
import { TestEntity3 } from "./TestEntity3"

@Entity()
export class TestEntity4 {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne((t) => TestEntity3, (entity3) => entity3.Entity4)
    Entity3: TestEntity3
}
