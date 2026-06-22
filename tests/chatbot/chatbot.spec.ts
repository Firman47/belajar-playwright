import { test, expect } from "@playwright/test";
import { ChatbotPage } from "./pages/ChatbotPage";

test.describe("Chatbot Module", () => {
  test("[CHT-001] @smoke Chatbot toggle — bisa dibuka dan ditutup", async ({ page }) => {
    const chatbotPage = new ChatbotPage(page);

    await test.step("Buka homepage", async () => {
      await chatbotPage.open();
    });

    await test.step("Klik tombol Open Chatbot", async () => {
      await expect(chatbotPage.chatbotToggle).toBeVisible();
      await chatbotPage.openChatbot();
    });

    await test.step("Verifikasi panel chatbot terbuka", async () => {
      await expect(chatbotPage.chatbotHeading).toBeVisible({ timeout: 5000 });
      await expect(chatbotPage.chatInput).toBeVisible();
      await expect(chatbotPage.sendButton).toBeVisible();
    });

    await test.step("Tutup chatbot", async () => {
      await chatbotPage.closeChatbot();
    });

    await test.step("Verifikasi chatbot tertutup", async () => {
      await expect(chatbotPage.chatbotToggle).toBeVisible();
    });
  });

  test("[CHT-002] Chatbot — bisa mengirim pesan", async ({ page }) => {
    const chatbotPage = new ChatbotPage(page);

    await test.step("Buka homepage dan buka chatbot", async () => {
      await chatbotPage.open();
      await chatbotPage.openChatbot();
      await expect(chatbotPage.chatInput).toBeVisible({ timeout: 5000 });
    });

    await test.step("Kirim pesan ke chatbot", async () => {
      await chatbotPage.sendMessage("Halo");
    });

    await test.step("Verifikasi pesan terkirim (muncul di chat)", async () => {
      await expect(page.getByText("You").first()).toBeVisible();
      await expect(page.getByText("Halo").first()).toBeVisible();
    });

    await test.step("Kirim pesan kedua", async () => {
      await chatbotPage.sendMessage("Produk apa yang termurah?");
    });

    await test.step("Verifikasi pesan kedua muncul", async () => {
      await expect(page.getByText("Produk apa yang termurah?")).toBeVisible();
    });
  });
});
