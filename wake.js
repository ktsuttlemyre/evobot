const { Client, Collection } = require("discord.js");
var TOKEN = process.env.SHIPMOD_TOKEN;

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
var pinging=false;
function keepAlive(string){
  pinging=true;
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
  var ttlm=30;
  var ttl=ttlm*60*1000;
  let channels = Guild.channels.cache.filter(c => c.type == 'text').array();
  var promises=[]
  for (let channel of channels) {
    if(!(channel.permissionsFor(Guild.me).has("VIEW_CHANNEL"))){
      continue;
    }
    var p=channel.messages.fetch()
      .then(function(messages){
          messages.forEach(function(message){
            if(message.author.bot){
              return
            }
            if((Date.now() - message.createdAt) < ttl) { //is user active in the last 30 minutes?
               keepAlive('Last message to guild was <'+ttlm+' minutes in channel['+channel.name+'] from user['+ message.author.username+']');
            }
          })
      })
      .catch(console.error);
    promises.push(p);
  }
  Promise.all(promises).then((values) => {
    //console.log('Checked all available channels.')
    if(!pinging){
      process.exit(0);
    }
  });
  
  
};

