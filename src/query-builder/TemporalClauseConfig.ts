/**
 * Possible types of temporal clause, two times are expected for all clauses apart from ALL,
 * if timeTwo is not specified it will be set to the value of timeOne
 */
type TemporalClauseType = 'AS OF' | 'FROM' | 'BETWEEN' | 'CONTAINED IN' | 'ALL'

/**
 * Configuration object used to configure temporal clause,
 * If passed will add "FOR SYSTEM TIME" clause to line of query
 */
export interface TemporalClauseConfig {
        type: TemporalClauseType
        timeOne: string
        timeTwo?: string
}