import { Scenes } from "telegraf";
const scene = new Scenes.BaseScene("enterCode");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.on("message", async (ctx: any) => {});
export default scene;
