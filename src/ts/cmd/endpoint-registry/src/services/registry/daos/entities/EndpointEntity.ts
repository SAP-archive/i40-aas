import {Entity, Column, PrimaryGeneratedColumn, Unique, ManyToOne} from "typeorm";
import { AASDescriptorEntity } from "./AASDescriptorEntity";

@Entity()
//the combination for address and type should also be unique (to avoid saving double)
@Unique("url_address", ["address", "type"])
export class EndpointEntity {

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
    target!: string;

    //AASDescriptor : many Endpoints
    @ManyToOne(type => AASDescriptorEntity, aasdescriptor => aasdescriptor.endpoints,{onDelete: 'CASCADE'})
    aasdescriptor!: AASDescriptorEntity;


}
