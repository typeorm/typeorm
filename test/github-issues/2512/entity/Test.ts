import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {CreateDateColumn} from "../../../../src";

@Entity()
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({default: ""})
  description: string;

  @CreateDateColumn({ type: "timestamp with time zone" })
  create_date: Date;
}
