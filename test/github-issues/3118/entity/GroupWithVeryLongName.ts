import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { AuthorWithVeryLongName } from "./AuthorWithVeryLongName";

@Entity()
export class GroupWithVeryLongName {
    @PrimaryGeneratedColumn()
    groupId: number;

    @Column()
    name: string;

    @OneToMany(() => AuthorWithVeryLongName, author => author.groupWithVeryLongName)
    authorsWithVeryLongName: AuthorWithVeryLongName[];
}
