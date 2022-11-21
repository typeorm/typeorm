import { Column, Entity, PrimaryColumn } from "../../../../../src"

export type WithType<T> = T & { type: "Post" }

@Entity()
export class Post {
    @PrimaryColumn()
    id: number & { type: "Post" }

    @Column()
    title: string & { type: "Post" }

    @Column()
    isEdited: boolean & { type: "Post" }
}
