import { Scenes } from "telegraf";
const scene = new Scenes.BaseScene("admin");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.hears("Kodlarni yaratish", async (ctx: any) => {
  ctx.reply("Kodlar sonini kiriting");

  return await ctx.scene.enter("getCodes");
});

export default scene;
