require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require('discord.js');
const express = require('express');
const app = express();

// runtime
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(3000, () => console.log('Web server running'));

// client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Constants
const GUILD_ID = '1377796272773140631';
const ALLOWED_ROLE_ID = '1377985950654791749';
const WELCOME_CHANNEL_ID = '1378006742692139160';
const AUTO_ROLE_ID = '1378023053950324858';
const BUMP_CHANNEL_ID = '1378049985647480852';

// !say command
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // Silent bump-only channel enforcement
  if (message.channel.id === BUMP_CHANNEL_ID && !message.content.toLowerCase().startsWith('/bump')) {
    await message.delete().catch(() => {});
    return;
  }

  // !say command logic
  if (!message.content.startsWith('!say')) return;

  message.delete().catch(() => {});
  const hasAccess = message.member.roles.cache.has(ALLOWED_ROLE_ID);
  if (!hasAccess) {
    const reply = await message.channel.send("you don't have permission to use this application");
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    return;
  }

  const args = message.content.slice('!say'.length).trim().split(' ');
  let useEmbed = false;
  let color = '#5865F2';

  if (args[0]?.toLowerCase() === 'embed') {
    useEmbed = true;
    args.shift();
    if (args[0]?.startsWith('#')) {
      color = args.shift();
    }
  }

  const content = args.join(' ');
  if (!content) {
    const reply = await message.channel.send("please include a message");
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    return;
  }

  if (useEmbed) {
    const embed = new EmbedBuilder()
      .setDescription(content)
      .setColor(parseInt(color.replace('#', ''), 16));
    await message.channel.send({ embeds: [embed] });
  } else {
    await message.channel.send(content);
  }
});

// disboard embed monitor
client.on('messageCreate', async message => {
  if (message.author.id !== '302050872383242240') return;
  if (!message.embeds || message.embeds.length === 0) return;

  const embed = message.embeds[0];
  const description = embed.description?.toLowerCase() || '';

  if (description.includes('bump done')) {
    await message.delete().catch(() => {});
    message.channel.send('✅ thanks for bumping the server!');
  } else if (description.includes('try again in')) {
    await message.delete().catch(() => {});
    const match = description.match(/try again in (\d+) minutes?/);
    const waitTime = match ? match[1] : 'a few';
    message.channel.send(`⏳ you need to wait **${waitTime} minutes** before bumping again.`);
  }
});

// welcome
client.on('guildMemberAdd', async member => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
  if (!channel) return;

  try {
    await member.roles.add(AUTO_ROLE_ID);
    console.log(`✅ Gave role to ${member.user.tag}`);
  } catch (err) {
    console.error('❌ Failed to add role:', err);
  }

  const memberCount = member.guild.memberCount;
  const joinPosition = `${memberCount}${getOrdinalSuffix(memberCount)}`;

  const embed = new EmbedBuilder()
    .setTitle('hello twin')
    .setDescription(`hi <@${member.id}>.\nyou are the **${joinPosition}** member.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setColor(0x5865F2)
    .setFooter({ text: `${member.user.username} joined`, iconURL: member.user.displayAvatarURL({ dynamic: true }) });

  channel.send({ embeds: [embed] });
});

function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

client.login(process.env.TOKEN);
