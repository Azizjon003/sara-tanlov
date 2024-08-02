import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
import { uzbekistanRegions } from "./contact";
const scene = new Scenes.BaseScene("sendMessage");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.hears("Barcha viloyatlar", async (ctx: any) => {
  ctx.scene.state.selectedRegion = "all";
  await ctx.reply("Endi xabaringizni yozing:");
  // return ctx.wizard.next();
});

scene.hears(uzbekistanRegions, async (ctx: any) => {
  const selectedRegion = ctx.message.text;

  console.log("Selected region:", selectedRegion);
  if (!uzbekistanRegions.includes(selectedRegion)) {
    return ctx.reply("Iltimos, ro'yxatdan viloyat tanlang.");
  }

  ctx.scene.state.selectedRegion = selectedRegion;
  await ctx.reply("Endi xabaringizni yozing:");
  // return ctx.wizard.next();
});

scene.on("text", async (ctx: any) => {
  const message = ctx.message.text;
  const selectedRegion = ctx.scene.state.selectedRegion;

  let users;
  if (selectedRegion === "all") {
    users = await prisma.user.findMany();
  } else {
    users = await prisma.user.findMany({
      where: {
        region: selectedRegion,
      },
    });
  }

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      await ctx.telegram.sendMessage(user.telegram_id, message);
      successCount++;
    } catch (error) {
      console.error(`Xabar yuborishda xatolik: ${user.telegram_id}`, error);
      failCount++;
    }
  }

  await ctx.reply(
    `Xabar yuborildi:\nMuvaffaqiyatli: ${successCount}\nMuvaffaqiyatsiz: ${failCount}`
  );
  return ctx.scene.enter("admin"); // Admin panelga qaytish
});

export default scene;
