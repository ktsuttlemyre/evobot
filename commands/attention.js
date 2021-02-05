const { canModifyQueue, LOCALE } = require("../util/EvobotUtil");
const i18n = require("i18n");

i18n.setLocale(LOCALE);

module.exports = {
  name: "attention",
  aliases: ["att"],
  description: i18n.__("attention.description"),
  execute(message, args) {
    const queue = message.client.queue.get(message.guild.id);

    if (!queue) return message.reply(i18n.__("volume.errorNotQueue")).catch(console.error);
    if (!canModifyQueue(message.member))
      return message.reply(i18n.__("volume.errorNotChannel")).catch(console.error);

    queue.attention.on = !queue.attention.on;
    return queue.textChannel.send(i18n.__mf("attention.result", { arg: queue.attention.on })).catch(console.error);
  }
};
