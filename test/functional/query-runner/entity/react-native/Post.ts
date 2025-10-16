import {
    Entity,
    PrimaryColumn,
    Column,
    Unique,
    Check,
} from "../../../../../src"

// For react-native (uses sqlite under the hood) we use double quotes
@Entity()
@Unique(["text", "tag"])
@Check(`[version] < 999`)
export class Post {
    @PrimaryColumn()
    id: number

    @Column({ unique: true })
    version: number

    @Column({ default: "My post" })
    name: string

    @Column()
    text: string

    @Column()
    tag: string
}
