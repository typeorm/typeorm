import { Entity, PrimaryColumn, Column, Unique, Check, Exclusion } from "../../../../../src";

// For react-native (uses sqlite under the hood) we use double quotes
@Entity()
@Unique(["text", "tag"])
@Exclusion(`USING gist ("name" WITH =)`)
@Check(`"version" < 999`)
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
