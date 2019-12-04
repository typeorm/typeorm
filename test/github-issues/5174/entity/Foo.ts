import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryColumn, Column} from '../../../../src';

@Entity()
export class Foo {

  @PrimaryColumn()
  id: number;

  @Column()
  type: string;

}
