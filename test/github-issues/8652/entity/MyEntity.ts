import { Entity, PrimaryColumn } from '../../../../src';


@Entity()
export default class MyEntity {
  @PrimaryColumn({
    rawTransformer: {
      from: (value: any) => {
        if (typeof value !== 'string' && value !instanceof String)
          throw new Error('invalid type: ' + typeof value + ', ' + JSON.stringify(value));

        return new Date(Date.parse(value) + (1 - new Date().getTimezoneOffset()) * 60000);
      },
      to: (value: Date) => {
        const dY = value.getUTCFullYear().toString().padStart(4, '0');
        const dM = (value.getUTCMonth() + 1).toString().padStart(2, '0');
        const dD = (value.getUTCDate() + 1).toString().padStart(2, '0');
        const tH = value.getUTCHours().toString().padStart(2, '0');
        const tM = value.getUTCMinutes().toString().padStart(2, '0');
        const tS = value.getUTCSeconds().toString().padStart(2, '0');

        return `${dY}-${dM}-${dD} ${tH}:${tM}:${tS}`;
      },
    },
  })
  declare sample: Date;
}
