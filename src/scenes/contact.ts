import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
import { checkUzbekPhoneNumber } from "../utils/functions";
import { keyboards } from "../utils/keyboards";
const scene = new Scenes.BaseScene("contact");

export const uzbekistanRegions = [
  "Toshkent shahri",
  "Toshkent viloyati",
  "Andijon viloyati",
  "Buxoro viloyati",
  "Farg'ona viloyati",
  "Jizzax viloyati",
  "Xorazm viloyati",
  "Namangan viloyati",
  "Navoiy viloyati",
  "Qashqadaryo viloyati",
  "Qoraqalpog'iston Respublikasi",
  "Samarqand viloyati",
  "Sirdaryo viloyati",
  "Surxondaryo viloyati",
];
scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.on("message", async (ctx: any) => {
  let phone = ctx.message?.contact?.phone_number || ctx.message?.text; // message text
  phone = phone.replace("+", "");
  const isTest = checkUzbekPhoneNumber(phone);

  console.log(isTest, phone);
  if (!isTest) {
    return ctx.reply("Raqamingizni qaytadan kiriting xato kiritildi");
  }

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

  const isUser = await prisma.user.findFirst({
    where: {
      phone: String(phone),
    },
  });

  if (isUser) {
    return ctx.reply(
      "Bu raqam boshqa foydalanuvchi tomonidan ishlatilmoqda.Qaytadan ishlatib ko'ring raqamni"
    );
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      phone: String(phone),
    },
  });

  await ctx.reply(
    "Raqamingiz qabul qilindi\nIltimos, viloyatingizni tanlang:",
    keyboards(uzbekistanRegions)
  );

  return await ctx.scene.enter("region");
});
export default scene;
