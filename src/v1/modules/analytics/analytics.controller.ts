import { Controller, Get, Param, Query } from "@nestjs/common";
import ExpensesService from "./services/expenses.service";
import { FiltersDto } from "./dtos/filters.dto";
import SuppliersService from "./services/suppliers.service";
import ProductsService from "./services/products.service";

@Controller('analytics')
export default class AnalyticsController{
    constructor(
        private readonly expensesService: ExpensesService,
        private readonly supplierService: SuppliersService,
        private readonly productsService: ProductsService
    ){}

    @Get('/expenses')
    expenses(
        @Query() params: FiltersDto){
        return this.expensesService.getTotalExpenses(params);
    }
    @Get('/highest')
    average(
        @Query() params: FiltersDto){
        return this.expensesService.getHighestExpenses(params);
    }

    @Get('/topSeller')
    topSeller(
        @Query() params: FiltersDto){
        return this.supplierService.getTopSellerSuppliers(params)
    }

    @Get('/bestSelling')
    bestSelling(
        @Query() params: FiltersDto){
        return this.productsService.getBestSellingProduct(params)
    }
}