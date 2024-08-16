require("dotenv").config();
import { Context, Middleware } from "telegraf";
import { SceneContext } from "telegraf/typings/scenes";
import bot from "./core/bot";
import session from "./core/session";
import stage from "./scenes/index";
import botStart from "./utils/startBot";
import { subcribeFunk } from "./utils/subcribe";

bot.use(session);
bot.use(subcribeFunk);

const middleware: Middleware<Context | SceneContext> = (ctx: any, next) => {
  ctx?.session ?? (ctx.session = {});
};

bot.use(stage.middleware());

bot.use((ctx: any, next) => {
  console.log("next", ctx?.session);
  return next();
});

bot.start(async (ctx: any) => {
  return await ctx.scene.enter("start");
});

bot.hears(
  ["📮Kodni yuborish", "🎁Sovg'alar", "📃Aksiya haqida"], //  commandlar bot o'chib qolgan vaziyatda user qayta startni  bosganda javob berish uchun
  async (ctx: any) => {
    ctx.reply("Nomalum buyruq.Qayta /start buyrug'ini bosing");
  }
);

bot.catch(async (err: any, ctx) => {
  const userId = ctx?.from?.id;
  if (userId) {
    await bot.telegram.sendMessage(
      userId,
      "Xatolik yuz berdi. Iltimos qayta urinib ko'ring\n /start buyrug'ini bosib qayta urunib ko'ring"
    );
  }

  console.log(err);
  console.log(`Ooops, encountered an error for ${ctx}`, err);
});

bot.telegram.setMyCommands([
  {
    command: "start",
    description: "Botni qayta ishga tushirish",
  },
]);
botStart(bot);

process.on("uncaughtException", (error) => {
  console.log("Ushlanmagan istisno:", error, "Sabab:", new Date());
});

process.on("unhandledRejection", (reason, promise) => {
  console.log("Ushlanmagan rad etilgan va'da:", promise, "Sabab:", new Date());
});

process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log(err, origin, "uncaughtExceptionMonitor");
});
