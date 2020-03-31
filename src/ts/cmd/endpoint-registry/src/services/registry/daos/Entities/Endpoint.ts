import {Entity, Column, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Endpoint {

    @PrimaryGeneratedColumn()
    endpointId!: number;

    @Column()
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
