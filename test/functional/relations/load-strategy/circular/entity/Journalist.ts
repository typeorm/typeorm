import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Column,
} from "../../../../../../src"
import { Publisher } from "./Publisher"

@Entity()
export class Journalist {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Publisher, { eager: true, nullable: true })
    publisher?: Publisher
}
