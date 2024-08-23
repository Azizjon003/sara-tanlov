import { format, subWeeks } from "date-fns";
import fs from "fs";
import { Scenes } from "telegraf";
import * as XLSX from "xlsx";
import prisma from "../../prisma/prisma";
import bot from "../core/bot";
import { keyboards } from "../utils/keyboards";
import { uzbekistanRegions } from "./contact";
const scene = new Scenes.BaseScene("admin");
const { format, utcToZonedTime } = require("date-fns-tz");

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

scene.hears("Kirish kodni olish", async (ctx: any) => {
  const user_id = ctx.from?.id;

  const user = await prisma.user.findFirst({
    where: {
      telegram_id: String(user_id),
    },
  });

  if (!user) {
    return ctx.reply("Sizda kodlar mavjud emas");
  }

  await prisma.userSession.deleteMany();

  const code = generateRandomCode();
  await prisma.userSession.create({
    data: {
      userId: user.id,
      enteredCode: code,
    },
  });

  return ctx.reply(`🔑 Kod: ${code}`);
});
bot.hears("O'yin haftasini yaratish", async (ctx: any) => {
  const user_id = ctx.from?.id;

  // Foydalanuvchini tekshirish (admin ekanligini)
  const user = await prisma.user.findFirst({
    where: {
      telegram_id: String(user_id),
      role: "ADMIN", // Faqat adminlar o'yin haftasini yarata oladi
    },
  });

  if (!user) {
    return ctx.reply("Sizda bu amalni bajarish uchun huquq yo'q.");
  }

  const endDate = new Date(); // Bugungi sana
  const startDate = subWeeks(endDate, 1); // Bir hafta oldingi sana

  try {
    // Mavjud faol o'yin haftasini tekshirish
    const existingGameWeek = await prisma.gameWeek.findFirst({
      where: {
        endDate: { gte: new Date() },
      },
    });

    if (existingGameWeek) {
      return ctx.reply(
        "Hozirda faol o'yin haftasi mavjud. Yangi hafta yaratish uchun joriy hafta tugashini kuting."
      );
    }

    // Yangi o'yin haftasini yaratish
    const newGameWeek = await prisma.gameWeek.create({
      data: {
        startDate,
        endDate,
      },
    });

    const formattedStartDate = format(startDate, "dd.MM.yyyy");
    const formattedEndDate = format(endDate, "dd.MM.yyyy");

    ctx.reply(
      `Yangi o'yin haftasi yaratildi:\nBoshlanish sanasi: ${formattedStartDate}\nTugash sanasi: ${formattedEndDate}`
    );
  } catch (error) {
    console.error("O'yin haftasini yaratishda xatolik:", error);
    ctx.reply(
      "O'yin haftasini yaratishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
    );
  }
});

bot.hears(
  "O'yin haftalik hisobotini olish o'yin o'tkazilgan holatdan keyin",
  async (ctx: any) => {
    const user_id = ctx.from?.id;

    // Foydalanuvchini tekshirish (admin ekanligini)
    const user = await prisma.user.findFirst({
      where: {
        telegram_id: String(user_id),
        role: "ADMIN", // Faqat adminlar hisobotni ola oladi
      },
    });

    if (!user) {
      return ctx.reply("Sizda bu amalni bajarish uchun huquq yo'q.");
    }

    try {
      // Eng so'nggi o'yin haftasini topish
      const latestGameWeek = await prisma.gameWeek.findFirst({
        orderBy: { endDate: "desc" },
      });

      if (!latestGameWeek) {
        return ctx.reply("Hech qanday o'yin haftasi topilmadi.");
      }

      // O'yin haftasida qatnashgan foydalanuvchilarni topish
      const participants = await prisma.userGameParticipation.findMany({
        where: {
          gameWeekId: latestGameWeek.id,
          hasParticipated: true,
        },

        include: {
          user: {
            include: {
              receivedGifts: true,
            },
          },
        },
      });

      // Excel fayli uchun ma'lumotlarni tayyorlash
      const worksheetData = participants.map((participant, index) => ({
        "№": index + 1,
        "Foydalanuvchi nomi": participant.user.name || "Noma'lum",
        "Telefon raqami": participant.user.phone || "Noma'lum",
        Viloyat: participant.user.region || "Noma'lum",
        "Telegram ID": participant.user.telegram_id,
        "Sovg'a ": participant.user.receivedGifts[0].giftId || "Noma'lum",
        "Qatnashgan vaqti": format(
          participant.updatedAt,
          "dd.MM.yyyy HH:mm:ss"
        ),
      }));

      // Excel faylini yaratish
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ishtirokchilar");

      // Fayl nomini shakllantirish
      const fileName = `O'yin_hafta_hisobot_${format(
        latestGameWeek.startDate,
        "dd.MM.yyyy"
      )}_${format(latestGameWeek.endDate, "dd.MM.yyyy")}.xlsx`;

      // Faylni saqlash
      XLSX.writeFile(workbook, fileName);

      // Faylni telegram orqali yuborish
      await ctx.replyWithDocument({ source: fileName });

      // Faylni o'chirish
      fs.unlinkSync(fileName);

      ctx.reply(
        `Hisobot yaratildi va yuborildi.\nIshtirokchilar soni: ${participants.length}`
      );
    } catch (error) {
      console.error("Hisobot yaratishda xatolik:", error);
      ctx.reply(
        "Hisobot yaratishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
      );
    }
  }
);

// bot.hears("Faollashtirilgan kodlar hisoboti", async (ctx: any) => {
//   const user_id = ctx.from?.id;

//   // Фойдаланувчини текшириш (админ эканлигини)
//   const user = await prisma.user.findFirst({
//     where: {
//       telegram_id: String(user_id),
//       role: "ADMIN", // Фақат админлар ҳисоботни ола олади
//     },
//   });

//   if (!user) {
//     return ctx.reply("Sizda bu amalni bajarish uchun huquq yo'q.");
//   }

//   try {
//     // Умумий фаоллаштирилган кодлар сонини ҳисоблаш
//     const totalActivatedCodes = await prisma.code.count({
//       where: {
//         isUsed: true,
//       },
//     });

//     // Энг сўнгги ўйин ҳафтасини топиш
//     const latestGameWeek = await prisma.gameWeek.findFirst({
//       orderBy: { endDate: "desc" },
//     });

//     let weeklyActivatedCodes = 0;
//     let weeklyActivatedCodesMessage = "";

//     if (latestGameWeek) {
//       // Охирги ўйин ҳафтасида фаоллаштирилган кодлар сонини ҳисоблаш
//       weeklyActivatedCodes = await prisma.code.count({
//         where: {
//           isUsed: true,
//           user_codes: {
//             some: {
//               created_at: {
//                 gte: latestGameWeek.startDate,
//                 lte: latestGameWeek.endDate,
//               },
//             },
//           },
//         },
//       });

//       weeklyActivatedCodesMessage =
//         `\n\nOxirgi o'yin haftasida faollashtirilgan kodlar soni: ${weeklyActivatedCodes}` +
//         `\n(${format(latestGameWeek.startDate, "dd.MM.yyyy")} - ${format(
//           latestGameWeek.endDate,
//           "dd.MM.yyyy"
//         )})`;
//     }

//     // Ҳисоботни юбориш
//     const reportMessage =
//       `Umumiy faollashtirilgan kodlar soni: ${totalActivatedCodes}` +
//       weeklyActivatedCodesMessage;

//     ctx.reply(reportMessage);
//   } catch (error) {
//     console.error("Faollashtirilgan kodlar hisobotini olishda xatolik:", error);
//     ctx.reply(
//       "Hisobot olishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
//     );
//   }
// });

bot.hears(
  "Faollashtirilgan kodlar hisoboti oxirgi haftalik",
  async (ctx: any) => {
    const user_id = ctx.from?.id;

    // Foydalanuvchini tekshirish (admin ekanligini)
    const user = await prisma.user.findFirst({
      where: {
        telegram_id: String(user_id),
        role: "ADMIN", // Faqat adminlar hisobotni ola oladi
      },
    });

    if (!user) {
      return ctx.reply("Sizda bu amalni bajarish uchun huquq yo'q.");
    }

    try {
      // Eng so'nggi o'yin haftasini topish
      const latestGameWeek = await prisma.gameWeek.findFirst({
        orderBy: { endDate: "desc" },
      });

      if (!latestGameWeek) {
        return ctx.reply("Hech qanday o'yin haftasi topilmadi.");
      }

      // Oxirgi o'yin haftasida faollashtirilgan kodlarni olish
      const activatedCodes = await prisma.code.findMany({
        where: {
          isUsed: true,
          user_codes: {
            some: {
              created_at: {
                gte: latestGameWeek.startDate,
                lte: latestGameWeek.endDate,
              },
            },
          },
        },
        include: {
          user_codes: {
            include: {
              user: true,
            },
          },
        },
      });

      // Excel fayli uchun ma'lumotlarni tayyorlash
      const worksheetData = activatedCodes.map((code, index) => ({
        "№": index + 1,
        Kod: code.code,
        "Foydalanuvchi nomi": code.user_codes[0]?.user.name || "Noma'lum",
        "Telefon raqami": code.user_codes[0]?.user.phone || "Noma'lum",
        "Telegram ID": code.user_codes[0]?.user.telegram_id,
        Viloyat: code.user_codes[0].user.region || "Noma'lum",
        "Faollashtirilgan vaqt": format(
          code.user_codes[0]?.created_at,
          "dd.MM.yyyy HH:mm:ss"
        ),
      }));

      // Excel faylini yaratish
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Faollashtirilgan Kodlar"
      );

      // Fayl nomini shakllantirish
      const fileName = `Faollashtirilgan_Kodlar_Hisobot_${format(
        latestGameWeek.startDate,
        "dd.MM.yyyy"
      )}_${format(latestGameWeek.endDate, "dd.MM.yyyy")}.xlsx`;

      // Faylni saqlash
      XLSX.writeFile(workbook, fileName);

      // Faylni telegram orqali yuborish
      await ctx.replyWithDocument({ source: fileName });

      // Faylni o'chirish
      fs.unlinkSync(fileName);

      ctx.reply(
        `Hisobot yaratildi va yuborildi.\nFaollashtirilgan kodlar soni: ${activatedCodes.length}`
      );
    } catch (error) {
      console.error("Hisobot yaratishda xatolik:", error);
      ctx.reply(
        "Hisobot yaratishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
      );
    }
  }
);
bot.hears("Umumiy hisobot", async (ctx: any) => {
  const user_id = ctx.from?.id;

  // Foydalanuvchini tekshirish (admin ekanligini)
  const user = await prisma.user.findFirst({
    where: {
      telegram_id: String(user_id),
      role: "ADMIN", // Faqat adminlar hisobotni ola oladi
    },
  });

  if (!user) {
    return ctx.reply("Sizda bu amalni bajarish uchun huquq yo'q.");
  }

  try {
    // Barcha faollashtirilgan kodlarni olish
    let activatedCodes = await prisma.code.findMany({
      where: {
        isUsed: true,
      },
      include: {
        user_codes: {
          include: {
            user: true,
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
      orderBy: {},
    });

    activatedCodes.sort((a, b) => {
      // Har bir kod uchun eng so'nggi user_code sanasini olamiz
      const dateA = a.user_codes[0]?.created_at;
      const dateB = b.user_codes[0]?.created_at;

      // // Agar biror kod uchun user_code mavjud bo'lmasa
      // if (!dateA) return 1; // a ni ro'yxat oxiriga suramiz
      // if (!dateB) return -1; // b ni ro'yxat oxiriga suramiz

      // Sana bo'yicha teskari tartibda saralaymiz (eng yangisi birinchi)
      return dateB.getTime() - dateA.getTime();
    });
    const timeZone = "Asia/Tashkent";
    // Excel fayli uchun ma'lumotlarni tayyorlash
    const worksheetData = activatedCodes.map((code, index) => {
      const createdAt = code.user_codes[0]?.created_at;
      const zonedDate = createdAt ? utcToZonedTime(createdAt, timeZone) : null;

      return {
        "№": index + 1,
        Kod: code.code,
        "Foydalanuvchi nomi": code.user_codes[0]?.user.name || "Noma'lum",
        "Telefon raqami": code.user_codes[0]?.user.phone || "Noma'lum",
        "Telegram ID": code.user_codes[0]?.user.telegram_id,
        Viloyat: code.user_codes[0]?.user.region || "Noma'lum",
        "Faollashtirilgan vaqt": zonedDate
          ? format(zonedDate, "dd.MM.yyyy HH:mm:ss", { timeZone })
          : "Noma'lum",
      };
    });
    // Excel faylini yaratish
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Barcha Faollashtirilgan Kodlar"
    );

    // Fayl nomini shakllantirish
    const fileName = `Umumiy_Hisobot_${format(
      new Date(),
      "dd.MM.yyyy_HH-mm-ss"
    )}.xlsx`;

    // Faylni saqlash
    XLSX.writeFile(workbook, fileName);

    // Faylni telegram orqali yuborish
    await ctx.replyWithDocument({ source: fileName });

    // Faylni o'chirish
    fs.unlinkSync(fileName);

    ctx.reply(
      `Umumiy hisobot yaratildi va yuborildi.\nJami faollashtirilgan kodlar soni: ${activatedCodes.length}`
    );
  } catch (error) {
    console.error("Hisobot yaratishda xatolik:", error);
    ctx.reply(
      "Hisobot yaratishda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring."
    );
  }
});

function generateRandomCode(): string {
  const min = 100000; // 6 ta raqamli sonning minimal qiymati
  const max = 999999; // 6 ta raqamli sonning maksimal qiymati
  const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomCode.toString();
}
export default scene;
