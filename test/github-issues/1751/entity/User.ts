import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id = undefined;

    @Column("varchar")
    email = "";

    @Column("varchar")
    avatarURL = "";
}
