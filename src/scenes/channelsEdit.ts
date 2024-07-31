import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
const scene = new Scenes.BaseScene("editChannel");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});
scene.action(/^channel_(.+)$/, async (ctx) => {
  const channelId = ctx.match[1];

  // Endi channelId bilan ishlash mumkin
  try {
    const channel = await prisma.channels.findFirst({
      where: { id: channelId },
    });

    if (channel) {
      let message = `📺 Kanal: ${channel.name}\n`;
      message += `🔗 Link: ${channel.link}\n`;
      message += `🏷️ Turi: ${channel.type}\n`;
      message += `📅 Yaratilgan sana: ${channel.created_at.toLocaleDateString()}`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "🔄 Yangilash",
              callback_data: `update_channel_${channel.id}`,
            },
            {
              text: "🗑️ O'chirish",
              callback_data: `delete_channel_${channel.id}`,
            },
          ],
          [{ text: "◀️ Orqaga", callback_data: "back_to_channels" }],
        ],
      };

      await ctx.answerCbQuery();
      await ctx.editMessageText(message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } else {
      await ctx.answerCbQuery("Kanal topilmadi", { show_alert: true });
    }
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi", { show_alert: true });
  }
});

// Yangilash uchun
scene.action(/^update_channel_(.+)$/, async (ctx: any) => {
  const channelId = ctx.match[1];

  // Foydalanuvchi holatini saqlash uchun session
  ctx.session.updateChannelId = channelId;
  ctx.session.awaitingChannelName = true;

  await ctx.answerCbQuery();
  await ctx.editMessageText("Iltimos, kanal uchun yangi nomni kiriting:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "❌ Bekor qilish",
            callback_data: `cancel_update_${channelId}`,
          },
        ],
      ],
    },
  });
});

scene.action(/^cancel_update_(.+)$/, async (ctx: any) => {
  const channelId = ctx.match[1];
  delete ctx.session.updateChannelId;
  delete ctx.session.awaitingChannelName;

  // Kanal ma'lumotlarini qayta ko'rsatish
  // (Bu yerda avvalgi kanal ma'lumotlarini ko'rsatish kodini takrorlash kerak)

  try {
    const channel = await prisma.channels.findFirst({
      where: { id: channelId },
    });

    if (channel) {
      let message = `📺 Kanal: ${channel.name}\n`;
      message += `🔗 Link: ${channel.link}\n`;
      message += `🏷️ Turi: ${channel.type}\n`;
      message += `📅 Yaratilgan sana: ${channel.created_at.toLocaleDateString()}`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "🔄 Yangilash",
              callback_data: `update_channel_${channel.id}`,
            },
            {
              text: "🗑️ O'chirish",
              callback_data: `delete_channel_${channel.id}`,
            },
          ],
          [{ text: "◀️ Orqaga", callback_data: "back_to_channels" }],
        ],
      };

      await ctx.answerCbQuery();
      await ctx.editMessageText(message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } else {
      await ctx.answerCbQuery("Kanal topilmadi", { show_alert: true });
    }
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi", { show_alert: true });
  }
});

scene.on("text", async (ctx: any) => {
  if (ctx.session.awaitingChannelName) {
    const channelId = ctx.session.updateChannelId;
    const newName = ctx.message.text;

    try {
      const updatedChannel = await prisma.channels.update({
        where: { id: channelId },
        data: { name: newName },
      });

      delete ctx.session.updateChannelId;
      delete ctx.session.awaitingChannelName;

      await ctx.reply(`Kanal nomi muvaffaqiyatli yangilandi: ${newName}`);

      // Yangilangan kanal ma'lumotlarini ko'rsatish
      let message = `📺 Kanal: ${updatedChannel.name}\n`;
      message += `🔗 Link: ${updatedChannel.link}\n`;
      message += `🏷️ Turi: ${updatedChannel.type}\n`;
      message += `📅 Yaratilgan sana: ${updatedChannel.created_at.toLocaleDateString()}`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "🔄 Yangilash",
              callback_data: `update_channel_${updatedChannel.id}`,
            },
            {
              text: "🗑️ O'chirish",
              callback_data: `delete_channel_${updatedChannel.id}`,
            },
          ],
          [{ text: "◀️ Orqaga", callback_data: "back_to_channels" }],
        ],
      };

      await ctx.reply(message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("Yangilashda xatolik yuz berdi:", error);
      await ctx.reply(
        "Kanal nomini yangilashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
      );
    }
  }
});

// O'chirish uchun
// O'chirish tugmasi bosilganda
scene.action(/^delete_channel_(.+)$/, async (ctx: any) => {
  const channelId = ctx.match[1];

  try {
    const channel = await prisma.channels.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      await ctx.answerCbQuery("Kanal topilmadi", { show_alert: true });
      return;
    }

    const confirmKeyboard = {
      inline_keyboard: [
        [
          {
            text: "✅ Ha, o'chirish",
            callback_data: `confirm_delete_${channelId}`,
          },
          {
            text: "❌ Yo'q, bekor qilish",
            callback_data: `cancel_delete_${channelId}`,
          },
        ],
      ],
    };

    await ctx.answerCbQuery();
    await ctx.editMessageText(
      `Haqiqatan ham "${channel.name}" kanalini o'chirishni xohlaysizmi?`,
      { reply_markup: confirmKeyboard }
    );
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi", { show_alert: true });
  }
});

// O'chirishni tasdiqlash
scene.action(/^confirm_delete_(.+)$/, async (ctx: any) => {
  const channelId = ctx.match[1];

  try {
    await prisma.channels.delete({
      where: { id: channelId },
    });

    await ctx.answerCbQuery("Kanal muvaffaqiyatli o'chirildi", {
      show_alert: true,
    });

    // Kanallar ro'yxatini qayta yuborish
    const channels = await prisma.channels.findMany();
    let text = "📊 Kanallar ro'yhati:\n\n";

    channels.forEach((channel, index) => {
      text += `${index + 1}. 📺 ${channel.name}\n`;
      text += `   🏷️ Turi: ${channel.type}\n\n`;
    });

    text += `📈 Jami kanallar soni: ${channels.length}`;

    const keyboard = {
      inline_keyboard: channels.map((channel, index) => [
        {
          text: `${index + 1}. 📺 ${channel.name}`,
          callback_data: `channel_${channel.id}`,
        },
      ]),
    };

    await ctx.editMessageText(text, {
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error("O'chirishda xatolik yuz berdi:", error);
    await ctx.answerCbQuery("Kanalini o'chirishda xatolik yuz berdi", {
      show_alert: true,
    });
  }
});

// O'chirishni bekor qilish
scene.action(/^cancel_delete_(.+)$/, async (ctx: any) => {
  const channelId = ctx.match[1];

  try {
    const channel = await prisma.channels.findUnique({
      where: { id: channelId },
    });

    if (channel) {
      let message = `📺 Kanal: ${channel.name}\n`;
      message += `🔗 Link: ${channel.link}\n`;
      message += `🏷️ Turi: ${channel.type}\n`;
      message += `📅 Yaratilgan sana: ${channel.created_at.toLocaleDateString()}`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "🔄 Yangilash",
              callback_data: `update_channel_${channel.id}`,
            },
            {
              text: "🗑️ O'chirish",
              callback_data: `delete_channel_${channel.id}`,
            },
          ],
          [{ text: "◀️ Orqaga", callback_data: "back_to_channels" }],
        ],
      };

      await ctx.answerCbQuery("O'chirish bekor qilindi");
      await ctx.editMessageText(message, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } else {
      await ctx.answerCbQuery("Kanal topilmadi", { show_alert: true });
    }
  } catch (error) {
    console.error("Xatolik yuz berdi:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi", { show_alert: true });
  }
});
// Orqaga qaytish uchun
scene.action("back_to_channels", async (ctx: any) => {
  ctx.deleteMessage();
  const channels = await prisma.channels.findMany();

  let text = "📊 Kanallar ro'yhati:\n\n";

  channels.forEach((channel, index) => {
    text += `${index + 1}. 📺 ${channel.name}\n`;
    text += `   🏷️ Turi: ${channel.type}\n\n`;
  });

  text += `📈 Jami kanallar soni: ${channels.length}`;

  const keyboard = {
    inline_keyboard: channels.map((channel, index) => [
      {
        text: `${index + 1}. 📺 ${channel.name}`,
        callback_data: `channel_${channel.id}`,
      },
    ]),
  };

  await ctx.reply(text, {
    reply_markup: keyboard,
  });
});

scene.action("add_new_channel", async (ctx: any) => {
  await ctx.answerCbQuery();
  await ctx.reply("Yangi kanal qo'shish uchun ma'lumotlarni kiriting:");
  await ctx.reply("Kanal nomini kiriting:");
  return ctx.scene.enter("addChannel");
});
export default scene;
