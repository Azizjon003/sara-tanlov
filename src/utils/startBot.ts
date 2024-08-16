const botStart = (bot: any) => {
  bot
    .launch()
    .then(() => {
      console.log("started");
    })
    .catch((err: any) => {
      console.log(err, "error nimadir", new Date());
    });
  console.log(`Bot nimadir has been started...`);
};

export default botStart;
