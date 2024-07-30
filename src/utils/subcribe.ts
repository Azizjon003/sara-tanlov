import prisma from "../../prisma/prisma";

export let subcribeFunk = async (ctx: any, next: any) => {
  const data = String(ctx?.callbackQuery?.data);
  const action = ctx.message?.text?.split(" ")[0];

  const id = String(ctx.from.id);

  const chatType = ctx.chat?.type;
  if (
    chatType === "channel" ||
    chatType === "supergroup" ||
    chatType === "group"
  ) {
    return next();
  }
  if (data?.includes("checkSubscribing")) {
    await ctx.deleteMessage();
  }
  let channelsData = await prisma.channels.findMany({
    where: {},
  });

  let channels = channelsData.map((item) => {
    return {
      name: item.name,
      link: item.link,
      type: item.type,
    };
  });

  let newChannels = channelsData.map((item) => {
    return {
      name: item.name,
      link: item.link,
      type: item.type,
    };
  });

  let allowedStatuses = ["creator", "administrator", "member"];
  for (let channel of channels) {
    if (channel.type === "channel") {
      let username = `@${channel.link}`;
      console.log(username);
      try {
        const { status } = await ctx.telegram.getChatMember(
          username,
          ctx.from.id
        );

        console.log(allowedStatuses, status);
        if (allowedStatuses.includes(status)) {
          channels = channels.filter(
            (c) => c !== channel && c.type == "channel"
          );
        }
      } catch (err) {
        console.log(err);
      }

      if (!channels.length) {
        if (data.includes("checkSubscribing")) {
          ctx.reply(
            `Tabriklaymiz! Siz botdan to'liq foydalanishingiz mumkin! 🎉\n/start buyrug'ini bosing`
          );
        }

        return next();
      }
    }
  }
  const text =
    "❗️ Botdan to'liq foydalanish imkoniga quyidagi kanallarga a'zo bo'lish orqali erishishingiz mumkin!";
  let keyboard: any = newChannels.map((channel) => [
    {
      text: `A'zo bo'lish: ${channel.name}`,
      url:
        channel.type == "channel"
          ? `https://t.me/${channel.link}`
          : channel.link,
    },
  ]);

  keyboard.push([
    {
      text: "Qo'shildim 🤝",
      callback_data: `checkSubscribing`,
    },
  ]);

  console.log(keyboard);
  return ctx.reply(text, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  });
};
