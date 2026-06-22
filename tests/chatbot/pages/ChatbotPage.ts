import { type Page, type Locator } from "@playwright/test";

const BASE_URL = "https://store.olpos.id/kurostoreid";

export class ChatbotPage {
  readonly page: Page;
  readonly chatbotToggle: Locator;
  readonly chatbotPanel: Locator;
  readonly chatbotHeading: Locator;
  readonly chatbotSubtitle: Locator;
  readonly refreshHistoryButton: Locator;
  readonly closeChatbotButton: Locator;
  readonly chatInput: Locator;
  readonly sendButton: Locator;
  readonly chatMessages: Locator;
  readonly assistantMessage: Locator;
  readonly userMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.chatbotToggle = page.getByRole("button", { name: /open chatbot/i });
    this.chatbotPanel = page.locator("[class*='chatbot'], [class*='chat-panel']").first();
    this.chatbotHeading = page.getByText("AI Product Assistant");
    this.chatbotSubtitle = page.getByText("Realtime recommendation");
    this.refreshHistoryButton = page.getByRole("button", { name: /refresh/i });
    this.closeChatbotButton = page.getByRole("button", { name: /close chatbot/i });
    this.chatInput = page.getByRole("textbox", { name: /find the cheapest product/i });
    this.sendButton = page.getByRole("button", { name: /send prompt/i });
    this.chatMessages = page.locator("[class*='chat']").last();
    this.assistantMessage = page.getByText("Assistant").locator("..");
    this.userMessage = page.getByText("You").locator("..");
  }

  async open() {
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState("networkidle");
  }

  async openChatbot() {
    if (await this.chatbotToggle.isVisible()) {
      await this.chatbotToggle.click();
    }
  }

  async closeChatbot() {
    if (await this.closeChatbotButton.isVisible()) {
      await this.closeChatbotButton.click();
    }
  }

  async sendMessage(text: string) {
    await this.chatInput.fill(text);
    await this.sendButton.click();
  }

  async isChatbotOpen(): Promise<boolean> {
    return await this.closeChatbotButton.isVisible().catch(() => false);
  }

  async getLastAssistantMessage(): Promise<string | null> {
    const messages = await this.page.getByText("Assistant").all();
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      const parent = lastMsg.locator("..");
      return await parent.textContent();
    }
    return null;
  }
}
