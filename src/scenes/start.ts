import { Scenes } from "telegraf";
import enabled from "../utils/enabled";
import { keyboards } from "../utils/keyboards";
const scene = new Scenes.BaseScene("start");

export let keyboard = [
  ["🔑 Kodni yuborish"],
  ["🏆 Sovg'alar", "📢 Aksiya haqida", "Qo'llanma"],
];
export let admin_keyboard = [
  ["Kodlarni yaratish", "Kanallar"],
  ["Xabar yuborish", "📊Statistika"],
  ["Kirish kodni olish"],
  ["O'yin haftasini yaratish"],
  ["Faollashtirilgan kodlar hisoboti oxirgi haftalik"],
  ["O'yin haftalik hisobotini olish o'yin o'tkazilgan holatdan keyin"], // Yangi tugma

  ["Umumiy hisobot"],
];

scene.enter(async (ctx: any) => {
  const user_id = ctx.from?.id;

  const user_name = ctx.from?.first_name || ctx.from?.username;

  const enable = await enabled(String(user_id), String(user_name));

  if (enable === "one") {
    ctx.telegram.sendMessage(
      user_id,
      `Assalomu alaykum!\n`,
      keyboards(keyboard)
    );

    console.log("start scene", user_name);
    return await ctx.scene.enter("control");
  } else if (enable === "two") {
    const text = "Assalomu alaykum Admin xush kelibsiz";

    ctx.telegram.sendMessage(user_id, text, keyboards(admin_keyboard));
    return await ctx.scene.enter("admin");
  } else if (enable === "three") {
    ctx.telegram.sendMessage(
      user_id,
      "Assalomu alaykum.Kechirasiz siz admin tomonidan bloklangansiz"
    );
    return;
  } else if (enable === "four") {
    ctx.telegram.sendMessage(
      user_id,
      `"Telefon raqamini yuborish" tugmasini bosing yoki telefon raqamingizni yozib qoldiring:`,
      {
        reply_markup: {
          keyboard: [
            [{ text: "Telefon raqamini yuborish", request_contact: true }],
          ],
          resize_keyboard: true,
        },
      }
    );

    return await ctx.scene.enter("contact");
  }
});

export default scene;
