import {Entity, Column, PrimaryColumn} from "typeorm";

@Entity()
export class Photo {



    @PrimaryColumn({
      length: 1024
      })
    id!: string;

    @Column({
    length: 100
    })
    idType!: string;

    @Column({
      length: 1024
      })
    assetId!: string;

    @Column({
      length: 1024
      })
    ertificate_x509_i40!: string;

    @Column({
      length: 1024
      })
    signature!: string;


}
