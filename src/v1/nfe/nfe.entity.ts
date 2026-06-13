import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../product/product.entity";

@Entity()
export class Nfe {
    @PrimaryGeneratedColumn()
    id: number; 

    @Column()
    numero: string;

    @Column()
    issuedAt: Date;

    @Column({
        name: "valor_total",
        type: "numeric",
        precision: 10,
        scale: 2,
    })
    valorTotal: number;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt: Date;

    @OneToMany(
        () => Product,
        product => product.nfe, 
        { cascade: true }
    )
    products: Product[];

    @Column()
    senderCnpj: string;

    @Column()
    senderCorporateName: string;

    @Column()
    receiverCnpj: string;

    @Column()
    receiverCorporateName: string;
}