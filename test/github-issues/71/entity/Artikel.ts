import { Column, Entity, Generated, JoinColumn, ManyToOne, PrimaryColumn } from "@typeorm/core";
import { Kollektion } from "./Kollektion";

@Entity("artikel")
export class Artikel {

    @PrimaryColumn("int", {name: "artikel_id"})
    @Generated()
    id: number;

    @Column({name: "artikel_nummer"})
    nummer: string;

    @Column({name: "artikel_name"})
    name: string;

    @Column({name: "artikel_extrabarcode"})
    extrabarcode: string;

    @Column({name: "artikel_saison"})
    saison: string;

    @ManyToOne(type => Kollektion, {cascade: true})
    @JoinColumn({name: "id_kollektion"})
    kollektion: Kollektion;

}
