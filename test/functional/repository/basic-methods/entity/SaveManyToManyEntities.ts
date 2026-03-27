import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { TrimTransformer } from "./TrimTransformer"

@Entity()
export class SaveManyToManyTag {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ transformer: new TrimTransformer() })
    label: string
}

@Entity()
export class SaveManyToManyArticle {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ transformer: new TrimTransformer() })
    title: string

    @ManyToMany(() => SaveManyToManyTag, { cascade: true, eager: true })
    @JoinTable()
    tags: SaveManyToManyTag[]
}
