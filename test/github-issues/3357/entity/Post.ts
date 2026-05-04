import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("character varying", {
        length: 50,
    })
    name: string
}
