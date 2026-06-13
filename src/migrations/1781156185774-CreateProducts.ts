import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProducts1781156185774 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "product" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(255) NOT NULL,
                "price" NUMERIC(10,2) NOT NULL,
                "category" VARCHAR(255) NOT NULL,
                "nfe_id" INTEGER NOT NULL,
                CONSTRAINT "FK_product_nfe"
                    FOREIGN KEY ("nfe_id")
                    REFERENCES "nfe"("id")
                    ON DELETE CASCADE
            );`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "product";`);
    }

}
