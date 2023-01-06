import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  TextChannel,
} from "discord.js";
import fetch from "node-fetch";
import { config } from "dotenv";
import {
  createMeshClient,
  CurrentEpochResponse,
  CurrentLayerResponse,
  GenesisTimeResponse,
} from "@andreivcodes/spacemeshlib";
config();

let networkOnline: boolean = false;

let netName: any,
  netId: any,
  currentEpoch: any,
  currentLayer: any,
  genesisTime: any;

const CHANNEL_ID = process.env.CHANNEL_ID!;
const OLD_MSG_ID = process.env.MESSAGE_ID!;

let prevMsgId: string;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function main() {
  client.on("ready", async () => {
    const channel = client.channels.cache.get(CHANNEL_ID) as TextChannel;

    prevMsgId = OLD_MSG_ID;

    const sendMessage = async () => {
      await getData();
      channel.messages
        .fetch(prevMsgId)
        .then((message) => {
          message
            .edit({ embeds: [createEmbed()] })
            .then(() => console.log("Edited!"));
        })
        .catch(() =>
          channel
            .send({ embeds: [createEmbed()] })
            .then((newMsg) => (prevMsgId = newMsg.id))
            .then(() => console.log("Created!"))
        );
    };
    sendMessage();
    setInterval(sendMessage, 10 * 60 * 1000);
  });

  client.on("error", (error: any) => {
    console.log(error);
  });

  client.login(process.env.TOKEN);
}

const createEmbed = () => {
  if (networkOnline && currentLayer != undefined) {
    console.log(
      `**Current Epoch**\n\`${currentEpoch}\` \u3000 \n**Current Layer**\n\`${currentLayer}\` \u3000 \n**Genesis time**\n\`${new Date(
        genesisTime * 1000
      ).toLocaleString("en-US")} GMT\` \u3000 \n**Uptime**\n\`${timeDiffCalc(
        new Date(genesisTime * 1000),
        new Date()
      )}\` \u3000`
    );
    return new EmbedBuilder()
      .setColor(0x0095ff)
      .setTitle(`Network Status - ${netName}`)
      .setDescription(
        `**Current Epoch**\n\`${currentEpoch}\` \u3000 \n**Current Layer**\n\`${currentLayer}\` \u3000 \n**Genesis time**\n\`${new Date(
          genesisTime * 1000
        ).toLocaleString("en-US")} GMT\` \u3000 \n**Uptime**\n\`${timeDiffCalc(
          new Date(genesisTime * 1000),
          new Date()
        )}\` \u3000`
      )
      .setThumbnail(`https://platform.spacemesh.io/favicon.png`)
      .setTimestamp(new Date())
      .setFooter({
        text: `Keep smeshing ❤️`,
        iconURL: `https://platform.spacemesh.io/favicon.png`,
      });
  } else {
    console.log(`**The network is currently offline**`);
    return new EmbedBuilder()
      .setColor(0x0095ff)
      .setTitle(`Network Status - ${netName}`)
      .setDescription(`**The network is currently offline**`)
      .setThumbnail(`https://platform.spacemesh.io/favicon.png`)
      .setTimestamp(new Date())
      .setFooter({
        text: `Keep smeshing ❤️`,
        iconURL: `https://platform.spacemesh.io/favicon.png`,
      });
  }
};

async function getData() {
  let url = "https://discover.spacemesh.io/networks.json";

  let networkUrl: string;

  await fetch(url)
    .then((response) => response.json())
    .then((res: any) => {
      networkUrl = res[0]["grpcAPI"].slice(0, -1).substring(8);
      netName = res[0]["netName"];
    })
    .then(async () => {
      networkUrl = "api-devnet310.spacemesh.io";
      console.log(networkUrl);
      const channel = createMeshClient(networkUrl, 443, true);

      console.log(channel);
      await channel
        .currentEpoch({})
        .then((r: CurrentEpochResponse) => {
          currentEpoch = r.epochnum?.value;
          networkOnline = true;
        })
        .catch(() => (networkOnline = false));

      await channel
        .currentLayer({})
        .then((r: CurrentLayerResponse) => {
          currentLayer = r.layernum?.number;
          networkOnline = true;
        })
        .catch(() => (networkOnline = false));

      await channel
        .genesisTime({})
        .then((r: GenesisTimeResponse) => {
          genesisTime = r.unixtime?.value;
          networkOnline = true;
        })
        .catch(() => (networkOnline = false));
    });
}

function timeDiffCalc(dateFuture: any, dateNow: any) {
  let diffInMilliSeconds = Math.abs(dateFuture - dateNow) / 1000;

  // calculate days
  const days = Math.floor(diffInMilliSeconds / 86400);
  diffInMilliSeconds -= days * 86400;

  // calculate hours
  const hours = Math.floor(diffInMilliSeconds / 3600) % 24;
  diffInMilliSeconds -= hours * 3600;

  // calculate minutes
  const minutes = Math.floor(diffInMilliSeconds / 60) % 60;
  diffInMilliSeconds -= minutes * 60;

  let difference = "";
  if (days > 0) {
    difference += days === 1 ? `${days} day, ` : `${days} days, `;
  }

  difference +=
    hours === 0 || hours === 1 ? `${hours} hour, ` : `${hours} hours, `;

  difference +=
    minutes === 0 || hours === 1 ? `${minutes} minutes` : `${minutes} minutes`;

  return difference;
}

main();
