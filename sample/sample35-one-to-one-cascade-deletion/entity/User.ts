import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "../../../src/index";
import { Profile } from "./Profile";

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToOne(() => Profile, (profile: { user: any; }) => profile.user, { eager: true, onDelete: "CASCADE" })
  @JoinColumn()
  profile: Profile;
}
