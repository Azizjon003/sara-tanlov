const { Scenes } = require("telegraf");
import admin from "./admin";
import contact from "./contact";
import control from "./control";
import enterCode from "./enterCode";
import getCodes from "./getCodes";
import start from "./start";
const stage = new Scenes.Stage([
  start,
  control,
  contact,
  enterCode,
  admin,
  getCodes,
]);

export default stage;
