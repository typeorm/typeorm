import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, default: "foo" })
  name: string;
}
