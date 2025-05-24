import { getMigrationSql } from "../../test/utils";

describe("ALTER COLUMN for type-only change", () => {
  it("emits ALTER COLUMN instead of drop+add", async () => {
    const sqls = await getMigrationSql(oldMeta, newMeta);
    expect(sqls).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/ALTER TABLE .* ALTER COLUMN .* TYPE/)
      ])
    );
  });
});
