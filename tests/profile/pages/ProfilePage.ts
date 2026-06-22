import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class ProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly userAvatar: Locator;
  readonly userName: Locator;
  readonly userEmail: Locator;
  readonly userPhone: Locator;
  readonly yourProfileButton: Locator;
  readonly changePasswordButton: Locator;
  readonly addressListButton: Locator;
  readonly languageButton: Locator;
  readonly logoutButton: Locator;
  readonly toastDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Settings" });
    this.userAvatar = page.locator("main").locator("[class*='avatar'], [class*='profile']").first();
    this.userName = page.getByRole("heading", { name: /firman/i });
    this.userEmail = page.getByText(/@gmail\.com|@/);
    this.userPhone = page.locator("main").getByText(/^\d+/);
    this.yourProfileButton = page.getByRole("button", { name: "Your Profile" });
    this.changePasswordButton = page.getByRole("button", { name: "Change Password" });
    this.addressListButton = page.getByRole("button", { name: "Address List" });
    this.languageButton = page.getByRole("button", { name: "Language" });
    this.logoutButton = page.getByRole("button", { name: "Logout" });
    this.toastDescription = page.locator('[data-slot="description"]');
  }

  async open() {
    await this.page.goto(`${BASE_URL}/setting`);
    await this.page.waitForLoadState("networkidle");
  }

  async clickLogout() {
    await this.logoutButton.click();
  }

  async clickYourProfile() {
    await this.yourProfileButton.click();
  }

  async clickAddressList() {
    await this.addressListButton.click();
  }

  async clickChangePassword() {
    await this.changePasswordButton.click();
  }
}
