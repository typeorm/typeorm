import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "../../../../src";
import { Bar } from "./Bar";

@Entity()
export class BarRefManyToOne {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  barId: number;

  @OneToOne(() => Bar, { cascade: true })
  bar: Bar;
}
