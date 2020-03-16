import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "../../../../src/decorator/entity/Entity";

@Entity({
  schema: "dbo", name: "sites", temporal: {
    sysStartTimeColumnName: "ValidFrom",
    sysEndTimeColumnName: "ValidTo"
  }
})
export class Site {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
      type: "varchar",
      nullable: false
    })
    name: string;

    @Column({
      type: "varchar",
      nullable: false
    })
    tag: string;
}