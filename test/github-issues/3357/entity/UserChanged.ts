import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src";

@Entity()
export class UserChanged {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 200, default: "foo" })
  name: string;
}
