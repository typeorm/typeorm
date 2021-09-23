import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "../../../../src";

@Entity({ name: "account" })
export class AccountEntity extends BaseEntity {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @ManyToOne((type) => AccountEntity, (account) => account.childAccounts)
  parentAccount: AccountEntity;

  @OneToMany((type) => AccountEntity, (account) => account.parentAccount)
  childAccounts: AccountEntity[];
}
