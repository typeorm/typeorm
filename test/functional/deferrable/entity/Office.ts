import { Column, Entity, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Company } from "./Company";

@Entity()
export class Office {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(type => Company, company => company.id, {
        deferrable: "INITIALLY IMMEDIATE",
    })
    company: Company;
}

