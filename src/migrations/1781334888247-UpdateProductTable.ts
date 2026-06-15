import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateProductTable1781334888247 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE product
            ADD COLUMN code VARCHAR(255) NOT NULL,
            ADD COLUMN quantity INTEGER NOT NULL;
        `)

        await queryRunner.query(`
            ALTER TABLE product
            RENAME COLUMN price TO unit_price;
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE product
            DROP COLUMN code ,
            DROP COLUMN quantity;
        `)

        await queryRunner.query(`
            ALTER TABLE product
            RENAME COLUMN unit_price TO price;
        `)
    }

}
