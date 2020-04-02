import {Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne} from "typeorm";
import { AASDescriptorEntity } from "./AASDescriptorEntity";

@Entity()
@Unique(["address"])
export class EndpointEntity {

    @PrimaryGeneratedColumn()
    endpointId!: number;

    @Column()
    address!: string;

    @Column({
      length: 1024
      })
    type!: string;

    @ManyToOne(type => AASDescriptorEntity, aasdescriptor => aasdescriptor.endpoints)
    aasdescriptor!: AASDescriptorEntity;


}
