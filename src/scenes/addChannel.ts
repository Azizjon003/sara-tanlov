import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
const scene = new Scenes.BaseScene("addChannel");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.enter(async (ctx: any) => {
  ctx.session.newChannel = {};
});

scene.on("text", async (ctx: any) => {
  if (!ctx.session.newChannel.name) {
    ctx.session.newChannel.name = ctx.message.text;
    await ctx.reply("Kanal linkini kiriting:");
  } else if (!ctx.session.newChannel.link) {
    ctx.session.newChannel.link = ctx.message.text;
    await ctx.reply("Kanal turini kiriting:");
  } else if (!ctx.session.newChannel.type) {
    ctx.session.newChannel.type = ctx.message.text;

    // Barcha ma'lumotlar kiritildi, endi kanalni saqlash
    try {
      const newChannel = await prisma.channels.create({
        data: ctx.session.newChannel,
      });

      await ctx.reply(
        `Yangi kanal muvaffaqiyatli qo'shildi:\n\n📺 Nomi: ${newChannel.name}\n🔗 Link: ${newChannel.link}\n🏷 Turi: ${newChannel.type}`
      );

      // Kanallar ro'yxatiga qaytish
      ctx.scene.enter("editChannel");
    } catch (error) {
      console.error("Kanal qo'shishda xatolik:", error);
      await ctx.reply(
        "Kanal qo'shishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
      );
    }
  }
});

export default scene;
