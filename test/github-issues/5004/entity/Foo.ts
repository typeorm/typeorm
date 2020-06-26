import { Column, Entity, Index } from "@typeorm/core";

@Entity()
export class Foo {
    @Column("date")
    @Index({expireAfterSeconds: 0})
    expireAt: Date;
}
