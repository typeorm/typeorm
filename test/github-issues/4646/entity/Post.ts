import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({ versioning: true })
// @Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
