import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity({ schema: "custom", name: "post" })
export class PostWithSchema {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
