import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Nfe } from "../nfe/nfe.entity";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    code: string

    @Column()
    name: string;

    @Column({
        name: "unit_price",
        type: "numeric",
        precision: 10,
        scale: 2,
    })
    unitPrice: number;

    @Column()
    quantity: number;

    @Column()
    category: string;

    @ManyToOne(
        () => Nfe, 
        nfe => nfe.products, 
        { onDelete: "CASCADE" }
    )   
    @JoinColumn({ 
        name: "nfe_id" ,
    })
    nfe: Nfe;
    
}