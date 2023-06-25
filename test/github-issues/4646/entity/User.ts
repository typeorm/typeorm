import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({ versioning: true })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
