import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
import bot from "../core/bot";
import { parseTelegramLink } from "../utils/functions";
const scene = new Scenes.BaseScene("control");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.hears("🏆 Sovg'alar", async (ctx) => {
  const text = await prisma.message.findFirst({
    where: {
      type: "sovga",
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // https://t.me/c/2171864802/2
  const { chatId, messageId } = parseTelegramLink(text?.link || "salom");
  bot.telegram.copyMessage(ctx.from.id, chatId, Number(messageId), {});
});

scene.hears("📢 Aksiya haqida", async (ctx) => {
  const text = await prisma.message.findFirst({
    where: {
      type: "aksiya",
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // https://t.me/c/2171864802/2
  const { chatId, messageId } = parseTelegramLink(text?.link || "salom");
  bot.telegram.copyMessage(ctx.from.id, chatId, Number(messageId), {});
});

scene.hears("Qo'llanma", async (ctx: any) => {
  const text = await prisma.message.findFirst({
    where: {
      type: "qollanma",
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // https://t.me/c/2171864802/2
  const { chatId, messageId } = parseTelegramLink(text?.link || "salom");
  bot.telegram.copyMessage(ctx.from.id, chatId, Number(messageId), {});
});

scene.hears("🔑 Kodni yuborish", async (ctx: any) => {
  ctx.reply("Kodni yuboring");
  ctx.session.codeAttempts = 0; // Urinishlar sonini kuzatish uchun
  return await ctx.scene.enter("enterCode");
});
export default scene;
