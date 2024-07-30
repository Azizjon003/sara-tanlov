const { Scenes } = require("telegraf");
import contact from "./contact";
import control from "./control";
import enterCode from "./enterCode";
import start from "./start";
const stage = new Scenes.Stage([start, control, contact, enterCode]);

export default stage;
