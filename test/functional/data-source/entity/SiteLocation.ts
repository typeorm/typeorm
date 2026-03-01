import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinColumn,
} from "../../../../src"
import { Site } from "./Site"

@Entity()
export class SiteLocation {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    address: string

    @OneToOne(() => Site)
    @JoinColumn()
    site: Site
}
