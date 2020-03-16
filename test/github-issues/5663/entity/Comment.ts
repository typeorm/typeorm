import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "../../../../src/decorator/entity/Entity";

@Entity({
  name: "comments",
  temporal: {
    sysStartTimeColumnName: "validFrom",
    sysEndTimeColumnName: "validTo"
  }
})
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
      type: "varchar",
      nullable: false
    })
    body: string;

    @Column({
      type: "varchar",
      nullable: false
    })
    tag: string;
}