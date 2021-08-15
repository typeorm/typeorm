import { Entity, PrimaryColumn, Column } from "../../../../src";

@Entity({
  name: "USERS"
})
export class User {
  @PrimaryColumn()
  email: string;

  @PrimaryColumn()
  username: string;

  @Column()
  bio: string;
}
