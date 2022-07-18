import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column, Entity, OneToMany } from "typeorm"
import { AuthorWithVeryLongName } from "./AuthorWithVeryLongName"

@Entity()
export class GroupWithVeryLongName {
    @PrimaryGeneratedColumn()
    groupId: number

    @Column()
    name: string

    @OneToMany(
        () => AuthorWithVeryLongName,
        (author) => author.groupWithVeryLongName,
    )
    authorsWithVeryLongName: AuthorWithVeryLongName[]
}
