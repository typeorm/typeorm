import { Column,Entity,Generated,Index,PrimaryColumn } from "../../../src/index";

@Entity()
export class Post {
  @PrimaryColumn()
  @Generated("uuid")
  id: string;

  @Column()
  @Index()
  title: string;

  @Column()
  text: string;

  @Column({ nullable: false })
  likesCount: number;
}
