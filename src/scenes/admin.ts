import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
import { keyboards } from "../utils/keyboards";
import { uzbekistanRegions } from "./contact";
const scene = new Scenes.BaseScene("admin");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.hears("Kodlarni yaratish", async (ctx: any) => {
  ctx.reply("Kodlar sonini kiriting");

  return await ctx.scene.enter("getCodes");
});

scene.hears("Kanallar", async (ctx: any) => {
  const channels = await prisma.channels.findMany();

  let text = "📊 Kanallar ro'yhati:\n\n";

  channels.forEach((channel, index) => {
    text += `${index + 1}. 📺 ${channel.name}\n`;
    text += `   🏷️ Turi: ${channel.type}\n\n`;
  });

  text += `📈 Jami kanallar soni: ${channels.length}`;

  const channelButtons = channels.map((channel, index) => [
    {
      text: `${index + 1}. 📺 ${channel.name}`,
      callback_data: `channel_${channel.id}`,
    },
  ]);

  // Kanal qo'shish tugmasini qo'shamiz
  const addChannelButton = [
    {
      text: "➕ Yangi kanal qo'shish",
      callback_data: "add_new_channel",
    },
  ];

  const keyboard = {
    inline_keyboard: [...channelButtons, addChannelButton],
  };

  await ctx.reply(text, {
    reply_markup: keyboard,
  });

  return ctx.scene.enter("editChannel");
});

scene.hears("Xabar yuborish", async (ctx: any) => {
  await ctx.reply(
    "Xabar yubormoqchi bo'lgan viloyatni tanlang:",
    keyboards([...uzbekistanRegions, "Barcha viloyatlar"])
  );

  return ctx.scene.enter("sendMessage");
});

scene.hears("📊Statistika", async (ctx: any) => {
  const users = await prisma.user.findMany();
  const channels = await prisma.channels.findMany();

  const text = `📊 Statistika:\n\n👤 Foydalanuvchilar soni: ${users.length}\n📺 Kanallar soni: ${channels.length}`;

  await ctx.reply(text);
  return ctx.scene.enter("admin");
});

export default scene;
