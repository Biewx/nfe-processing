import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateNfeTable1781334173254 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE nfe
            ADD COLUMN issued_at TIMESTAMP,
            ADD COLUMN sender_cnpj VARCHAR(14) NOT NULL,
            ADD COLUMN sender_corporate_name VARCHAR(255) NOT NULL,
            ADD COLUMN receiver_cnpj VARCHAR(14) NOT NULL,
            ADD COLUMN receiver_corporate_name VARCHAR(255) NOT NULL;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE nfe
            DROP COLUMN issued_at,
            DROP COLUMN sender_cnpj,
            DROP COLUMN sender_corporate_name,
            DROP COLUMN receiver_cnpj,
            DROP COLUMN receiver_corporate_name;
        `)
    }

}
