import {Entity, Column, ManyToOne, Generated, PrimaryColumn, JoinColumn} from "../../../../src";
import { User } from "./User";
import {ID_TRANSFORMER} from "../transformer";

@Entity()
export class Post {
    @Generated("increment")
    @PrimaryColumn({
        type: "integer",
        transformer: ID_TRANSFORMER,
    })
  id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ type: "integer", transformer: ID_TRANSFORMER })
  public userId: string;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn()
  user: User;
}
