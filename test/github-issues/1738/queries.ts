export const CASE_1_UNFORMATTED = `SELECT * FROM tbl`;
export const CASE_1_FORMATTED = `SELECT
  *
FROM
  tbl`;

export const CASE_2_UNFORMATTED = `SELECT tbl1.col1, tbl2.col2 FROM tbl1 INNER JOIN tbl2 ON tbl1.id = tbl2.id`;
export const CASE__FORMATTED = `SELECT
  tbl1.col1,
  tbl2.col2
FROM
  tbl1
  INNER JOIN tbl2 ON tbl1.id = tbl2.id`;


export const FORMAT_SQL_TEST_CASES = [
    {
        unformatted: CASE_1_UNFORMATTED,
        formatted: CASE_1_FORMATTED,
    },
    {
        unformatted: CASE_2_UNFORMATTED,
        formatted: CASE__FORMATTED,
    },
];