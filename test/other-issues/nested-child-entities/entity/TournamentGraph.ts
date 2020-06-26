import { Entity, OneToOne, PrimaryGeneratedColumn } from "@typeorm/core";

import { Tournament } from "./Tournament";

@Entity()
export class TournamentGraph {
    @PrimaryGeneratedColumn()
    public id: number;

    @OneToOne(type => Tournament, tournament => tournament.graph)
    public tournament: Tournament;
}
