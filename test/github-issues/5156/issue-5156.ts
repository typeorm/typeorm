import "reflect-metadata";

import { Foo } from "./entity/Foo";
import { expect } from "chai";
import { getMetadataArgsStorage } from "../../../src";


describe("github issues > #5156 it identifies lazy load properties if the global Promise has been changed", () => {

    it("Identifies promise by the current name of the global promise", () => {

        const metadataArgsStorage = getMetadataArgsStorage();
        const barRelation = metadataArgsStorage.relations.filter(relation => relation.target === Foo);

        expect(barRelation.length).to.eql(1);
        expect(barRelation[0].isLazy).to.eql(true);
    });
});
