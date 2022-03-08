import {
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from "../../../../src";
import { User } from "./User";

@Entity()
export class Post {
  @PrimaryColumn({ type: "int", nullable: false })
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => User, user => user.posts)
  user: User;
}
