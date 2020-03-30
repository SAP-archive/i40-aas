import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Photo {



    @PrimaryGeneratedColumn()
    endpointId!: number;

    @Column({
    length: 100
    })
    address!: string;

    @Column({
      length: 1024
      })
    type!: string;

    @Column({
      length: 1024
      })
      aasId!: string;

}
