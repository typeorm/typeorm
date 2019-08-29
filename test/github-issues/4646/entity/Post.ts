import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "../../../../src/decorator/entity/Entity";

@Entity({
  schema: "dbo", name: "posts", temporal: {
    historicalTableName: "post_hist",
    sysStartTimeColumnName: "valid_from",
    sysEndTimeColumnName: "valid_to"
  }
})
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
      type: "nvarchar",
      length: 512,
      nullable: false
    })
    title: string;

    @Column({
      type: "nvarchar",
      length: 1024,
      nullable: false
    })
    body: string;

    @Column({
      type: "datetime2",
      nullable: false
    })
    valid_from: Date;

    @Column({
      type: "datetime2",
      nullable: false
    })
    valid_to: Date;
}
