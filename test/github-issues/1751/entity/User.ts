import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity({
  name: "USERS"
})
export class User {

    @PrimaryGeneratedColumn()
    id = undefined;

    @Column("varchar")
    email = "";

    @Column("varchar")
    avatarURL = "";
}
