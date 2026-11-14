import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Edition } from "./Edition"

@Entity()
export class Chapter {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Edition, (edition) => edition.chapters)
    edition: Edition
}
