import {Entity, Column, PrimaryColumn} from "typeorm";

export enum IdTypeEnum {
  IRDI = 'IRDI',
  IRI = 'IRI',
  Custom = 'Custom',
  IdShort = 'IdShort',
}


@Entity()
export class Photo {



    @PrimaryColumn()
    id!: string;

    @Column( {type: "enum",
    enum: IdTypeEnum,
    default: IdTypeEnum.Custom}
    )
    idType!: IdTypeEnum;

}
