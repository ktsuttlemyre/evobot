const { Client, Collection } = require("discord.js");
let { TOKEN, PREFIX, LOCALE } = require("./util/EvobotUtil");
TOKEN = process.env.SHIPMOD_TOKEN;

const request = require('request');

const client = new Client({ 
  disableMentions: "everyone",
  restTimeOffset: 0
});

client.login(TOKEN);

/**
 * Client Events
 */
client.on("ready", () => {
  //console.log(`${client.user.username} ready!`);
  //client.user.setActivity(`${PREFIX}help and ${PREFIX}play`, { type: "LISTENING" });
  wakeHandler(client);
  //client.destroy();
});
client.on("warn", (info) => {
  console.log(info);
});
client.on("error", (e) => {
  console.error(e);
  process.exit(1);
});


let lastKeepAlive=null;
function keepAlive(string){
  var website="https://"+process.env.HEROKU_APP_NAME+".herokuapp.com";
  console.log('KeepAlive - Pinging '+website+' for reason:'+string);
  request(website, function(err, res, body){
    if (err) { 
      console.log(err);
      process.exit(1);
    }
    console.log('successfully pinged '+website);
    lastKeepAlive=Date.now();
    process.exit(0);
    //console.log(body.url);
    //console.log(body.explanation);
  });
};



//wake handler
function wakeHandler(client){
  const Guild = client.guilds.cache.get("690661623831986266"); // Getting the guild.
//   const owners = ['500468522468507648','500467960914116609']; // Getting shipwash
//   for(var i=0,l=owners.length;i<l;i++){
//     //check user activity status
//     var member=Guild.members.cache.get(owners[i]);
//     if(member.presence.status == 'online'){
//       keepAlive(member.displayName+' is online');
//       return true
//     }
//   }

  Guild.members.cache.some(function(member){
    if(member.user.bot){
      return false;
    }
    // Checking if the member is connected to a VoiceChannel.
    if (member.voice.channel && member.voice.channel.id !== Guild.afkChannelID && member.voice.guild.id == Guild.id) { 
        // The member is connected to a voice channel.
        // https://discord.js.org/#/docs/main/stable/class/VoiceState
        keepAlive(member.displayName+' is in '+member.voice.channel.name+' voice channel');
        return true
        //console.log(`${member.user.tag} is connected to ${member.voice.channel.name}!`);
    } //else {
        // The member is not connected to a voice channel.
      //  console.log(`${member.user.tag} is not connected.`);
    //};


  }); //end some
  
  //see if theres a message in a text channel that is less than 30 minutes old
  var ttl=30*60*1000;
  let channels = Guild.channels.filter(c => c.type == 'text').array();
  for (let channel of channels) {
    await channel.messages.fetch()
      .then(messages => {
        messages.forEach(function(message){
          if(message.author.bot){
            return
          }
          if((Date.now() - message.createdAt) < ttl) { //is user active in the last 30 minutes?
             keepAlive('last message to guild was less than 10 minutes old from '+ message.author.username);
          }
      })
      .catch(console.error);
  }
  
  
};




