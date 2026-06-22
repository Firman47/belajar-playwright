import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class PcBuilderPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subheading: Locator;
  readonly backButton: Locator;
  readonly simaskoBadge: Locator;
  readonly selectedItemsCount: Locator;
  readonly powerEstimation: Locator;
  readonly progressText: Locator;
  readonly progressBar: Locator;
  readonly processorSection: Locator;
  readonly motherboardSection: Locator;
  readonly ramSection: Locator;
  readonly storageSection: Locator;
  readonly psuSection: Locator;
  readonly vgaSection: Locator;
  readonly cpuCoolerSection: Locator;
  readonly casingSection: Locator;
  readonly monitorSection: Locator;
  readonly keyboardSection: Locator;
  readonly mouseSection: Locator;
  readonly ringkasanHeading: Locator;
  readonly estimatedTotal: Locator;
  readonly addAllToCartButton: Locator;
  readonly resetAllButton: Locator;
  readonly noComponentsText: Locator;
  readonly toastDescription: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Build PC" });
    this.subheading = page.getByText("Build Your Dream PC");
    this.backButton = page.getByRole("button", { name: "Back" });
    this.simaskoBadge = page.getByText("Simasko Builder");
    this.selectedItemsCount = page.getByText("Selected Items").locator("..");
    this.powerEstimation = page.getByText("Power Estimation").locator("..");
    this.progressText = page.getByText(/Required component progress/i);
    this.progressBar = page.getByRole("progressbar");
    this.processorSection = page.getByRole("button", { name: /Pilih Processor|Processor/i });
    this.motherboardSection = page.getByRole("button", { name: /Pilih Motherboard|Motherboard/i });
    this.ramSection = page.getByRole("button", { name: /Tambah RAM|RAM/i });
    this.storageSection = page.getByRole("button", { name: /Tambah Storage|Storage/i });
    this.psuSection = page.getByRole("button", { name: /Pilih Power Supply|Power Supply|PSU/i });
    this.vgaSection = page.getByRole("button", { name: /Pilih Graphic Card|VGA/i });
    this.cpuCoolerSection = page.getByRole("button", { name: /Tambah CPU Cooler/i });
    this.casingSection = page.getByRole("button", { name: /Pilih Casing/i });
    this.monitorSection = page.getByRole("button", { name: /Tambah Monitor/i });
    this.keyboardSection = page.getByRole("button", { name: /Tambah Keyboard/i });
    this.mouseSection = page.getByRole("button", { name: /Tambah Mouse/i });
    this.ringkasanHeading = page.getByRole("heading", { name: "Ringkasan Rakitan" });
    this.estimatedTotal = page.getByText("Estimated Total").locator("..");
    this.addAllToCartButton = page.getByRole("button", { name: "Add All to Cart" });
    this.resetAllButton = page.getByRole("button", { name: "Reset All" });
    this.noComponentsText = page.getByText("No components selected yet");
    this.toastDescription = page.locator('[data-slot="description"]');
  }

  async open() {
    await this.page.goto(`${BASE_URL}/simasko/rakit-komputer`);
    await this.page.waitForLoadState("networkidle");
  }

  async getSelectedItemCount(): Promise<string | null> {
    return await this.selectedItemsCount.textContent();
  }

  async getProgress(): Promise<string | null> {
    return await this.progressText.textContent();
  }

  async clickResetAll() {
    await this.resetAllButton.click();
  }
}
