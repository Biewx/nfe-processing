import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "../product/product.entity";

@Entity()
export class Nfe {
    @PrimaryGeneratedColumn()
    id: number; 

    @Column()
    numero: string;

    @Column({
        name: 'issued_at',
        type: 'timestamp'
    })
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

    @Column({name: "sender_cnpj"})
    senderCnpj: string;

    @Column({name: "sender_corporate_name"})
    senderCorporateName: string;

    @Column({name: "receiver_cnpj"})
    receiverCnpj: string;

    @Column({name: "receiver_corporate_name"})
    receiverCorporateName: string;
}