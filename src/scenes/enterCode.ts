import { Scenes } from "telegraf";
import prisma from "../../prisma/prisma";
const scene = new Scenes.BaseScene("enterCode");

scene.hears("/start", async (ctx: any) => {
  return await ctx.scene.enter("start");
});

scene.on("message", async (ctx: any) => {
  const user = await prisma.user.findUnique({
    where: { telegram_id: ctx.from.id.toString() },
  });

  console.log(ctx.session, "session");

  if (!user) {
    return ctx.reply(
      "Siz ro'yxatdan o'tmagansiz. Iltimos, avval ro'yxatdan o'ting."
    );
  }

  if (!user.isActive) {
    return ctx.reply(
      "Sizning hisobingiz faol emas. Administrator bilan bog'laning."
    );
  }

  const lastCodeAttempt = await prisma.user_codes.findFirst({
    where: { user: { telegram_id: ctx.from.id.toString() } },
    orderBy: { created_at: "desc" },
  });

  if (
    lastCodeAttempt &&
    Date.now() - lastCodeAttempt.created_at.getTime() < 60 * 60 * 1000
  ) {
    return ctx.reply(
      "Siz so'nggi 1 soat ichida kod yuborgansiz. Iltimos, keyinroq urinib ko'ring.Qayta /start buyrug'ini bosgan holda"
    );
  }

  const enteredCode = ctx.message.text.trim();

  if (enteredCode.length !== 6) {
    return ctx.reply(
      "Kodni noto'g'ri kiritdingiz. Iltimos, 6 ta raqamdan iborat kodni kiriting"
    );
  }
  const codeRecord = await prisma.code.findUnique({
    where: { code: enteredCode },
    include: { user_codes: true },
  });

  if (!codeRecord) {
    ctx.session.codeAttempts++;

    console.log("Urinishlar soni:", ctx.session.codeAttempts);
    if (ctx.session.codeAttempts >= 3) {
      await ctx.reply(
        "Siz 3 marta noto'g'ri kod kiritdingiz. Iltimos, keyinroq urinib ko'ring."
      );
      return ctx.scene.leave();
    }
    return ctx.reply("Noto'g'ri kod. Iltimos, qaytadan urinib ko'ring:");
  }

  if (codeRecord.isUsed || codeRecord.user_codes.length > 0) {
    return ctx.reply(
      "Bu kod allaqachon ishlatilgan. Iltimos, boshqa kod kiriting:"
    );
  }

  try {
    await prisma.user_codes.create({
      data: {
        user_id: user.id,
        code_id: codeRecord.id,
      },
    });

    // Kodni ishlatilgan deb belgilash
    await prisma.code.update({
      where: { id: codeRecord.id },
      data: { isUsed: true },
    });

    await ctx.reply("Kod muvaffaqiyatli qo'shildi!");
    return ctx.scene.enter("control");
  } catch (error) {
    console.error("Kod qo'shishda xatolik:", error);
    await ctx.reply("Xatolik yuz berdi. Iltimos, keyinroq urinib ko'ring.");
    return ctx.scene.enter("start");
  }
});
export default scene;
