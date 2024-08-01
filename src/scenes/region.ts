import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
import { keyboards } from "../utils/keyboards";
import { uzbekistanRegions } from "./contact";
import { keyboard } from "./start";
const scene = new Scenes.BaseScene("region");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.hears(uzbekistanRegions, async (ctx: any) => {
  const selectedRegion = ctx.message.text;

  const user = await prisma.user.findFirst({
    where: {
      telegram_id: String(ctx.from.id),
    },
  });

  if (!user) {
    return ctx.reply(
      "Foydalanuvchi topilmadi.\n Qaytadan /start buyrug'ini bosing"
    );
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      region: selectedRegion,
    },
  });

  await ctx.reply(
    "Viloyatingiz qabul qilindi\nBotdan bemalol foydalanishingiz mumkin",
    keyboards(keyboard)
  );
  return ctx.scene.enter("control");
});

export default scene;
