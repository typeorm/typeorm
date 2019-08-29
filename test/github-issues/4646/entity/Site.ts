import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Entity } from "../../../../src/decorator/entity/Entity";

@Entity({
  schema: "dbo", name: "sites", temporal: {
    historicalTableName: "sites_temporal",
    sysStartTimeColumnName: "ValidFrom",
    sysEndTimeColumnName: "ValidTo"
  }
})
export class Site {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({
      type: "nvarchar",
      length: 512,
      nullable: false
    })
    name: string;

    @Column({
      type: "nvarchar",
      length: 128,
      nullable: false
    })
    tag: string;
}
