import { Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;
}
