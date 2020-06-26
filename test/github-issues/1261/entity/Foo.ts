import { BaseEntity, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Foo extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

}
