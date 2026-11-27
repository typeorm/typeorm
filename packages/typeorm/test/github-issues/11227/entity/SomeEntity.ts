import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from "../../../../src"
import { SuperLongRelatedEntityNameDontAskWhy } from "./SuperLongRelatedEntityNameDontAskWhy"

@Entity()
export class SomeEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    superLongRelatedEntityNameDontAskWhy_id: number

    @OneToOne(() => SuperLongRelatedEntityNameDontAskWhy)
    @JoinColumn({ name: "superLongRelatedEntityNameDontAskWhy_id" })
    superLongRelatedEntityNameDontAskWhy: SuperLongRelatedEntityNameDontAskWhy
}
