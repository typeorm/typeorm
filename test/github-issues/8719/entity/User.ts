import {
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from "../../../../src";
import {Post} from "./Post";

@Entity()
export class User {
  @PrimaryColumn({ type: "int", nullable: false })
  id: number;

  @Column()
  name: string;

  @OneToMany(() => Post, post => post.user)
  posts: Post[];
}
