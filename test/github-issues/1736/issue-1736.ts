import "reflect-metadata";
import {DateUtils} from "../../../src/util/DateUtils";

describe("github issues > #1736 Milliseconds are parsed incorrectly from datetime string", () => {

    it("should correctly parse milliseconds from datetime string", () =>  {
        DateUtils.mixedDateToDatetimeString("2018-03-10T16:13:08.002Z").should.be.equal("2018-03-10 21:13:08.002");
        DateUtils.mixedDateToDatetimeString("2018-03-10T16:13:08.020Z").should.be.equal("2018-03-10 21:13:08.020");
        DateUtils.mixedDateToDatetimeString("2018-03-10T16:13:08.200Z").should.be.equal("2018-03-10 21:13:08.200");

        DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.002Z").should.be.equal("2018-03-10 16:13:08.002");
        DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.020Z").should.be.equal("2018-03-10 16:13:08.020");
        DateUtils.mixedDateToUtcDatetimeString("2018-03-10T16:13:08.200Z").should.be.equal("2018-03-10 16:13:08.200");
    });

});
