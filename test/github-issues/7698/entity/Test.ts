import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity()
export class Test {

  @PrimaryGeneratedColumn({ type: 'int' })
  readonly id!: number;

  @Column({
    type: 'varchar',
    generatedType: 'STORED',
    // commented because it raised another error (https://jira.mariadb.org/browse/MDEV-13320) which is considered as an intentional behavior and irrelvant to #7698
    // asExpression: 'CONCAT(id, "-stored")', 
  })
  stored = '';
}