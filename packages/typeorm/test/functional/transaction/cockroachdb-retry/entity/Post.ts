import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column()
    version: number

    @Column()
    views: number
}
