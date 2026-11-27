import {
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    Column,
} from "../../../../../../src"
import { Journalist } from "./Journalist"

@Entity()
export class Magazine {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Journalist, { eager: true, nullable: true })
    journalist?: Journalist
}
