import { DatabaseType, Entity, MssqlParameter, PrimaryColumn } from '../../../../src';


@Entity()
export default class MyEntity {
  @PrimaryColumn({
    rawTransformer: {
      from: (value: any, type: DatabaseType) => {
        if (typeof value !== 'string' && value !instanceof String)
          throw new Error('invalid type: ' + typeof value + ', ' + JSON.stringify(value));

        if (type === 'mssql')
          return new Date(Date.parse(value) + 60000);
        return new Date(Date.parse(value) + (1 - new Date().getTimezoneOffset()) * 60000);
      },
      to: (value: Date, type: DatabaseType) => {
        const dY = value.getUTCFullYear().toString().padStart(4, '0');
        const dM = (value.getUTCMonth() + 1).toString().padStart(2, '0');
        const dD = (value.getUTCDate() + 1).toString().padStart(2, '0');
        const tH = value.getUTCHours().toString().padStart(2, '0');
        const tM = value.getUTCMinutes().toString().padStart(2, '0');
        const tS = value.getUTCSeconds().toString().padStart(2, '0');

        if (type === 'mssql')
          return new MssqlParameter(`${dY}-${dM}-${dD} ${tH}:${tM}:${tS} +0000`, 'datetime');
        else if (type === 'oracle')
          return () => `TO_DATE('${dY}-${dM}-${dD} ${tH}:${tM}:${tS}', 'YYYY-MM-DD HH24:MI:SS')`;
        return `${dY}-${dM}-${dD} ${tH}:${tM}:${tS}`;
      },
    },
  })
  declare sample: Date;
}
