import { Entity, Column, PrimaryGeneratedColumn } from "../../../../src";

export enum Realm {
    Blackrock = "Blackrock",
    KelThuzad = "Kel'Thuzad",
}

@Entity({
  name: "USERS"
})
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "enum", enum: Realm })
    realm: Realm;
}
