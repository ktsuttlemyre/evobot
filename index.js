/**
 * Module Imports
 */
const Discord = require("discord.js");
const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, PREFIX, LOCALE , isDJOnly, DJ_ROLE} = require("./util/EvobotUtil");
const path = require("path");
const i18n = require("i18n");

const client = new Client({ 
  disableMentions: "everyone",
  restTimeOffset: 0
});

client.login(TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

i18n.configure({
  locales: ["en", "es", "ko", "fr", "tr", "pt_br", "zh_cn", "zh_tw"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  objectNotation: true,
  register: global,

  logWarnFn: function (msg) {
    console.log("warn", msg);
  },

  logErrorFn: function (msg) {
    console.log("error", msg);
  },

  missingKeyFn: function (locale, value) {
    return value;
  },

  mustacheConfig: {
    tags: ["{{", "}}"],
    disable: false
  }
});

/**
 * Client Events
 */
client.on("ready", () => {
  console.log(`${client.user.username} ready!`);
  client.user.setActivity(`tunes! Type:${PREFIX}help for more info`, { type: "STREAMING" });
});
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

/**
 * Import all commands
 */
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  client.commands.set(command.name, command);
}
const SILENCE=new Discord.Speaking(0);

client.on("guildMemberSpeaking", async (member,speaking) => {
    if(member.bot){
      return
    }
    const queue = member.guild.client.queue.get(member.guild.id);
    const attention = queue.attention;
    if (!queue) return message.reply(i18n.__("volume.errorNotQueue")).catch(console.error);  
  
    if(speaking.equals(SILENCE)){ //not talking
	console.log('not speaking',queue.speaking)
    	attention.speaking=Math.max(--attention.speaking,0);
    }else{
      console.log('speaking',attention.speaking)
      //count the speaking population
      attention.speaking++;


      //create setInterval function
      if(attention.on && !attention.toID){
	//save original volume
        attention.original_volume=queue.volume;
        
        attention.toID = setInterval(function(){
          if(attention.speaking){
            console.log('speaking interval',attention.speaking)
            if(queue.volume>attention.min_volume){
              console.log('vol down',attention.speaking,queue.volume)
              //get volume
              let vol = queue.volume-3;
              //clamp value
              vol = Math.min(100,Math.max(attention.min_volume,vol));
              //set volume
              queue.volume=vol;
              queue.connection.dispatcher.setVolumeLogarithmic(vol / 100);
            }
          }else{//not speaking
            console.log('not speaking interval',attention.speaking)
            if(queue.volume<attention.original_volume){
	      console.log('vol up',attention.speaking,queue.volume)
              // get and add
              let volume=queue.volume+1;
              // set
              queue.volume=volume;
              queue.connection.dispatcher.setVolumeLogarithmic(volume / 100);
            }else{
              clearInterval(attention.toID);
              attention.toID=0;
            }
          }
    	},250);
      }
    }
});
client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(PREFIX)})\\s*`);
  if (!prefixRegex.test(message.content)) return;

  const [, matchedPrefix] = message.content.match(prefixRegex);

  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;
  
  if(isDJOnly(command.name,message.member,message.guild)) return message.reply(i18n.__mf("common.errorDJOnly",{DJ_ROLE:DJ_ROLE}));

  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;

  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        i18n.__mf("common.cooldownMessage", { time: timeLeft.toFixed(1), name: command.name })
      );
    }
  }

  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply(i18n.__("common.errorCommend")).catch(console.error);
  }
});
