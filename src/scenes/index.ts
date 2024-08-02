const { Scenes } = require("telegraf");
import addChannel from "./addChannel";
import admin from "./admin";
import channelEdit from "./channelsEdit";
import contact from "./contact";
import control from "./control";
import enterCode from "./enterCode";
import getCodes from "./getCodes";
import region from "./region";
import sendMessage from "./sendMessage";
import start from "./start";
const stage = new Scenes.Stage([
  start,
  control,
  contact,
  enterCode,
  admin,
  getCodes,
  channelEdit,
  addChannel,
  region,
  sendMessage,
]);

export default stage;
