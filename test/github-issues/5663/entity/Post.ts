import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "../../../../src/decorator/entity/Entity";

@Entity({
  schema: "dbo", name: "posts", temporal: {
    sysStartTimeColumnName: "valid_from",
    sysEndTimeColumnName: "valid_to"
  }
})
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
      type: "varchar",
      nullable: false
    })
    title: string;

    @Column({
      type: "varchar",
      nullable: false
    })
    body: string;

    @Column({
      type: "datetime",
      nullable: false
    })
    valid_from: Date;

    @Column({
      type: "datetime",
      nullable: false
    })
    valid_to: Date;
}