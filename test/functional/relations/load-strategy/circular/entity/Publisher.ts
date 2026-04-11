import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Column,
} from "../../../../../../src"
import { Magazine } from "./Magazine"

@Entity()
export class Publisher {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Magazine, { eager: true, nullable: true })
    magazine?: Magazine
}
