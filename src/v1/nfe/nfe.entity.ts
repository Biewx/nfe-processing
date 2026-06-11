import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Nfe {
    @PrimaryGeneratedColumn()
    id: number; 

    @Column()
    numero: string;

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
}