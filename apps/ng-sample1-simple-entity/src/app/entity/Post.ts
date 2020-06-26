import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/browser-core";
import { Category } from "./Category";
import { Author } from "./Author"

@Entity()
export class Post {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column("text")
  text: string;

  @ManyToMany(() => Category, {
    cascade: true
  })
  @JoinTable()
  categories: (Category | number | any)[];

  @ManyToOne(() => Author, author => author.posts, {
    cascade: true
  })
  author: Author | number | any;
}
