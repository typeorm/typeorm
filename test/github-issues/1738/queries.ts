export const CASE_1_UNFORMATTED = `SELECT * FROM tbl`
export const CASE_1_FORMATTED = `SELECT *
FROM tbl`

export const CASE_2_UNFORMATTED = `SELECT tbl1.col1, tbl2.col2 FROM tbl1 INNER JOIN tbl2 ON tbl1.id = tbl2.id`
export const CASE_2_FORMATTED = `SELECT tbl1.col1,
    tbl2.col2
FROM tbl1
    INNER JOIN tbl2 ON tbl1.id = tbl2.id`

export const CASE_3_UNFORMATTED = `SELECT col1, (SELECT col2 FROM tbl2 WHERE tbl2.id = tbl1.id) AS sub_col FROM tbl1`
export const CASE_3_FORMATTED = `SELECT col1,
    (
        SELECT col2
        FROM tbl2
        WHERE tbl2.id = tbl1.id
    ) AS sub_col
FROM tbl1`

export const FORMAT_SQL_TEST_CASES = [
    {
        unformatted: CASE_1_UNFORMATTED,
        formatted: CASE_1_FORMATTED,
    },
    {
        unformatted: CASE_2_UNFORMATTED,
        formatted: CASE_2_FORMATTED,
    },
    {
        unformatted: CASE_3_UNFORMATTED,
        formatted: CASE_3_FORMATTED,
    },
]
