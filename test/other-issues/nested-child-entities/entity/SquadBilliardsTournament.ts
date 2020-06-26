import { ChildEntity } from "@typeorm/core";

import { BilliardsTournament } from "./BilliardsTournament";

@ChildEntity()
export class SquadBilliardsTournament extends BilliardsTournament {
    constructor(squadBilliardsTournament?: { name: string }) {
        super(squadBilliardsTournament);
    }
}
