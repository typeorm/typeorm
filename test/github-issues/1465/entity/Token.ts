import { Column, Entity, PrimaryGeneratedColumn, TableInheritance } from "@typeorm/core";

@Entity()
@TableInheritance({column: {type: "varchar", name: "type"}})
export class Token {
    @PrimaryGeneratedColumn() id: number;

    @Column() tokenSecret: string;

    @Column() expiresOn: Date;
}
