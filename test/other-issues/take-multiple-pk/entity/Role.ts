import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Role {
    @PrimaryGeneratedColumn() id: number;

    @Column() name: string;
}
