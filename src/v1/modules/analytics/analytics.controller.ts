import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import ExpensesService from "./services/expenses.service";
import { FiltersDto } from "./dtos/filters.dto";
import SuppliersService from "./services/suppliers.service";
import ProductsService from "./services/products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export default class AnalyticsController{
    constructor(
        private readonly expensesService: ExpensesService,
        private readonly supplierService: SuppliersService,
        private readonly productsService: ProductsService
    ){}

    @Get('/expenses')
    expenses(
        @Query() params: FiltersDto,
        @CurrentUser() user){
        return this.expensesService.getTotalExpenses(params, user.companyId);
    }
    @Get('/highest')
    average(
        @Query() params: FiltersDto,
        @CurrentUser() user){
        return this.expensesService.getHighestExpenses(params, user.companyId);
    }

    @Get('/topSeller')
    topSeller(
        @Query() params: FiltersDto,
        @CurrentUser() user){
        return this.supplierService.getTopSellerSuppliers(params, user.companyId)
    }

    @Get('/bestSelling')
    bestSelling(
        @Query() params: FiltersDto,
        @CurrentUser() user){
        return this.productsService.getBestSellingProduct(params, user.companyId)
    }
}
