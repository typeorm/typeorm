import { Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

}
