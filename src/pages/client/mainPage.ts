import { Locator, Page } from "@playwright/test";
import { URLS } from "../../common/data/setup";

export class MainPage {

    readonly page: Page
    readonly aboutUsItem: Locator
    readonly servicesItem: Locator
    readonly productsItem: Locator
    readonly locationsItem: Locator
    readonly adminPage: Locator
    readonly registerLink: Locator

    constructor(page: Page){
        this.page = page
        this.aboutUsItem = page.getByRole('link', {name: 'About Us', exact: true})
        this.servicesItem = page.getByRole('link', {name: 'Services', exact: true})
        this.productsItem = page.getByRole('link', {name: 'Products', exact: true})
        this.locationsItem = page.getByRole('link', {name: 'Locations', exact: true})
        this.adminPage = page.getByRole('link', {name: 'Admin Page', exact: true})
        this.registerLink = page.getByRole('link', {name: 'Register', exact: true})
    }

    async open(){
        await this.page.goto(URLS.client)
    }

    async openRegisterPage(){
        await this.registerLink.click()
    }
}
