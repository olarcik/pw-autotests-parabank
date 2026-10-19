import { Locator, Page } from "@playwright/test";
import { HelperBase } from "../helperBase";

export class MainPage extends HelperBase{
    
    readonly aboutUsItem: Locator
    readonly servicesItem: Locator
    readonly productsItem: Locator
    readonly locationsItem: Locator
    readonly adminPage: Locator

    constructor(page: Page){
        super(page)
        this.aboutUsItem = page.getByRole('link', {name: 'About Us', exact: true})
        this.servicesItem = page.getByRole('link', {name: 'Services', exact: true})
        this.productsItem = page.getByRole('link', {name: 'Products', exact: true})
        this.locationsItem = page.getByRole('link', {name: 'Locations', exact: true})
        this.adminPage = page.getByRole('link', {name: 'Admin Page', exact: true})
    }

    
}