import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNFe1780988211100 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE nfe (
                id SERIAL PRIMARY KEY,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                numero VARCHAR(255) NOT NULL,
                valor_total NUMERIC(10, 2) NOT NULL

            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE nfe;
        `);
    }

}
