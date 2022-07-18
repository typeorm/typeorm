import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm"
import { Personalization } from "./Personalization"

@Entity()
export class Provider {
    @PrimaryGeneratedColumn("uuid") public id: string

    @Column() public name: string

    @Column() public description: string

    @OneToOne((_) => Personalization)
    @JoinColumn()
    public personalization: Personalization
}
