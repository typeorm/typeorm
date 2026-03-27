import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { TrimTransformer } from "./TrimTransformer"

@Entity()
export class SaveOneToOneProfile {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ transformer: new TrimTransformer() })
    bio: string
}

@Entity()
export class SaveOneToOneUser {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ transformer: new TrimTransformer() })
    name: string

    @OneToOne(() => SaveOneToOneProfile, { cascade: true, eager: true })
    @JoinColumn()
    profile: SaveOneToOneProfile
}
