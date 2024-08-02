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
  await ctx.reply(
    "Endi xabaringizni kanalga yozib uning linkini yuboring bizga:"
  );
  // return ctx.wizard.next();
});

// scene.on("text", async (ctx: any) => {
//   const message = ctx.message.text;
//   const selectedRegion = ctx.scene.state.selectedRegion;

//   let users;
//   if (selectedRegion === "all") {
//     users = await prisma.user.findMany();
//   } else {
//     users = await prisma.user.findMany({
//       where: {
//         region: selectedRegion,
//       },
//     });
//   }

//   let successCount = 0;
//   let failCount = 0;

//   for (const user of users) {
//     try {
//       await ctx.telegram.sendMessage(user.telegram_id, message);
//       successCount++;
//     } catch (error) {
//       console.error(`Xabar yuborishda xatolik: ${user.telegram_id}`, error);
//       failCount++;
//     }
//   }

//   await ctx.reply(
//     `Xabar yuborildi:\nMuvaffaqiyatli: ${successCount}\nMuvaffaqiyatsiz: ${failCount}`
//   );
//   return ctx.scene.enter("admin"); // Admin panelga qaytish
// });

scene.on("text", async (ctx: any) => {
  const messageLink = ctx.message.text;
  const selectedRegion = ctx.scene.state.selectedRegion;

  // Xabar linkini tekshirish
  const linkRegex = /^https:\/\/t\.me\/c\/(\d+)\/(\d+)$/;
  const match = messageLink.match(linkRegex);

  if (!match) {
    await ctx.reply(
      "Noto'g'ri format. Iltimos, to'g'ri xabar linkini yuboring."
    );
    return;
  }

  const channelId = match[1];
  const messageId = parseInt(match[2]);

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

  try {
    // Xabarni yopiq kanaldan olish
    const message = await ctx.telegram.forwardMessage(
      ctx.from.id,
      `-100${channelId}`,
      messageId
    );

    for (const user of users) {
      try {
        // Xabarni foydalanuvchiga yuborish
        await ctx.telegram.copyMessage(
          user.telegram_id,
          ctx.from.id,
          message.message_id
        );
        successCount++;
      } catch (error) {
        console.error(`Xabar yuborishda xatolik: ${user.telegram_id}`, error);
        failCount++;
      }
    }

    // Admin xabarini o'chirish
    await ctx.telegram.deleteMessage(ctx.from.id, message.message_id);
  } catch (error) {
    console.error("Xabarni olishda xatolik:", error);
    await ctx.reply(
      "Xabarni olishda xatolik yuz berdi. Iltimos, botning kanalga a'zo ekanligini va kerakli huquqlarga ega ekanligini tekshiring."
    );
    return;
  }

  await ctx.reply(
    `Xabar yuborildi:\nMuvaffaqiyatli: ${successCount}\nMuvaffaqiyatsiz: ${failCount}`
  );
  return ctx.scene.enter("admin"); // Admin panelga qaytish
});

export default scene;
