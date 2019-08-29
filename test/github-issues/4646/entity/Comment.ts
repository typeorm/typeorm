import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "../../../../src/decorator/entity/Entity";

@Entity({
  name: "comments",
  synchronize: false,
  temporal: {
    historicalTableName: "commentsHistorical",
    sysStartTimeColumnName: "sysStartTimeColumnName",
    sysEndTimeColumnName: "sysEndTimeColumnName"
  }
})
export class Comment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
      type: "nvarchar",
      length: 1024,
      nullable: false
    })
    body: string;

    @Column({
      type: "nvarchar",
      length: 128,
      nullable: false
    })
    tag: string;
}
