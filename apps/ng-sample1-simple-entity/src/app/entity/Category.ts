import {Entity, PrimaryGeneratedColumn, Column} from "@typeorm/browser-core";

@Entity()
export class Category {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

}
