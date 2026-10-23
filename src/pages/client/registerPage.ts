import { Locator, Page } from "@playwright/test";
import { User } from "../../common/interfaces/interface";

export class RegisterPage {

    readonly page: Page
    readonly heading: Locator
    readonly introText: Locator
    readonly firstNameInput: Locator
    readonly lastNameInput: Locator
    readonly addressInput: Locator
    readonly cityInput: Locator
    readonly stateInput: Locator
    readonly zipCodeInput: Locator
    readonly phoneInput: Locator
    readonly ssnInput: Locator
    readonly usernameInput: Locator
    readonly passwordInput: Locator
    readonly confirmPasswordInput: Locator
    readonly registerButton: Locator

    constructor(page: Page){
        this.page = page
        this.heading = page.getByRole('heading', {name: 'Signing up is easy!', exact: true})
        this.introText = page.getByText('If you have an account with us you can sign-up for free instant online access.')
        // Form labels are plain table cells not linked to the inputs, so getByLabel can't find them — use input ids
        this.firstNameInput = page.locator('[id="customer.firstName"]')
        this.lastNameInput = page.locator('[id="customer.lastName"]')
        this.addressInput = page.locator('[id="customer.address.street"]')
        this.cityInput = page.locator('[id="customer.address.city"]')
        this.stateInput = page.locator('[id="customer.address.state"]')
        this.zipCodeInput = page.locator('[id="customer.address.zipCode"]')
        this.phoneInput = page.locator('[id="customer.phoneNumber"]')
        this.ssnInput = page.locator('[id="customer.ssn"]')
        this.usernameInput = page.locator('[id="customer.username"]')
        this.passwordInput = page.locator('[id="customer.password"]')
        this.confirmPasswordInput = page.locator('#repeatedPassword')
        this.registerButton = page.getByRole('button', {name: 'Register', exact: true})
    }

    async fillForm(user: User){
        await this.firstNameInput.fill(user.firstName)
        await this.lastNameInput.fill(user.lastName)
        await this.addressInput.fill(user.address.street)
        await this.cityInput.fill(user.address.city)
        await this.stateInput.fill(user.address.state)
        await this.zipCodeInput.fill(user.address.zipCode)
        await this.phoneInput.fill(user.phoneNumber)
        await this.ssnInput.fill(user.ssn)
        await this.usernameInput.fill(user.username)
        await this.passwordInput.fill(user.password)
        await this.confirmPasswordInput.fill(user.password)
    }

    async register(user: User){
        await this.fillForm(user)
        await this.registerButton.click()
    }
}
