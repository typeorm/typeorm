import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "@typeorm/browser-core";
import { Post } from "./Post";

@Entity()
export class Author {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({nullable: true})
  birthday: Date;

  @OneToMany(() => Post, post => post.author)
  posts: (Post | number | any)[];
}
