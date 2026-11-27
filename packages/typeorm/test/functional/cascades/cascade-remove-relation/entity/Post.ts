import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Details } from "./Details"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    // cascade: ["insert"] only — no remove cascade
    @OneToOne(() => Details, (details) => details.post, {
        cascade: ["insert"],
        nullable: true,
    })
    @JoinColumn()
    details: Details | null
}
