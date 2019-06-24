import {Column, Entity, BaseEntity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn} from "../../../../src";

@Entity()
export class Organization extends BaseEntity {
  // allows us to pass in an object in the constructor
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "boolean", default: true })
  active: boolean;

  @Column({ type: "json", default: {} })
  metadata?: any;

  @UpdateDateColumn()
  updatedDate: Date;

  @CreateDateColumn()
  createdDate: Date;

}
