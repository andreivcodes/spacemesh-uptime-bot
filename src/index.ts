const { Client, Intents, MessageEmbed } = require("discord.js");
const request = require("request");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { ProtoGrpcType } = require("./proto/mesh");

require("dotenv").config();

const PROTO_PATH = __dirname + "/proto/mesh.proto";

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

let networkStatusMsg;

let netName: any,
  netId: any,
  currentEpoch: any,
  currentLayer: any,
  genesisTime: any;

async function main() {
  getData();
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS],
    autoReconnect: true,
  });
  console.log("Log in");
  client.login(process.env.TOKEN);
  client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const channel = client.channels.cache.get("924626320237936681");
    let networkStatusEmbed = await getMsg();

    try {
      let oldmsg = await channel.messages.fetch("1004674368896516179");
      networkStatusMsg = oldmsg;
    } catch {
      networkStatusMsg = await channel.send(networkStatusEmbed);
    }

    while (1) {
      try {
        getData();
        networkStatusEmbed = await getMsg();
      } catch (e) {
        console.log(`Err: ${e}`);
      }
      networkStatusMsg.edit(networkStatusEmbed);
      console.log("edited");
      await sleep(5 * 60 * 1000);
    }
  });
  client.on("error", (error: any) => {
    console.log(error);
  });
}

const getMsg = async () => {
  if (typeof currentLayer != "undefined")
    return {
      embeds: [
        {
          type: "rich",
          title: `Network Status - ${netName}`,
          thumbnail: {
            url: `https://platform.spacemesh.io/favicon.png`,
            height: 50,
            width: 50,
          },
          description: `**Network ID**\n\`${netId}\` \u3000 \n**Current Epoch**\n\`${currentEpoch}\` \u3000 \n**Current Layer**\n\`${currentLayer}\` \u3000 \n**Genesis time**\n\`${new Date(
            genesisTime * 1000
          ).toLocaleString(
            "en-US"
          )} GMT\` \u3000 \n**Uptime**\n\`${timeDiffCalc(
            new Date(genesisTime * 1000),
            new Date()
          )}\` \u3000`,
          color: 0x0095ff,
          timestamp: new Date(),
          footer: {
            text: `Keep smeshing ❤️`,
            icon_url: `https://platform.spacemesh.io/favicon.png`,
          },
        },
      ],
    };
  else
    return {
      embeds: [
        {
          type: "rich",
          title: `Network Status - Offline`,
          thumbnail: {
            url: `https://platform.spacemesh.io/favicon.png`,
            height: 50,
            width: 50,
          },
          description: `**The network is currently offline**`,
          color: 0x0095ff,
          timestamp: new Date(),
          footer: {
            text: `Keep smeshing ❤️`,
            icon_url: `https://platform.spacemesh.io/favicon.png`,
          },
        },
      ],
    };
};

async function getData() {
  console.log("getData");

  let url = "https://discover.spacemesh.io/networks.json";
  let options = { json: true };
  let networkUrl: String;

  request(
    url,
    options,
    (
      error: any,
      res: { statusCode: number; body: { [x: string]: string }[] },
      body: any
    ) => {
      if (error) {
        return console.log(error);
      }

      try {
        if (!error && res.statusCode == 200) {
          networkUrl = res.body[0]["grpcAPI"].slice(0, -1).substring(8);
          netName = res.body[0]["netName"];
        }

        console.log(networkUrl);

        const meshProto =
          grpc.loadPackageDefinition(packageDefinition).spacemesh.v1;
        const client = new meshProto.MeshService(
          `${networkUrl}:443`,
          grpc.credentials.createSsl()
        );

        client.NetID({}, (error: any, reponse: any) => {
          console.log(reponse);
          netId = reponse["netid"]["value"];
        });

        client.CurrentEpoch({}, (error: any, reponse: any) => {
          console.log(reponse);
          currentEpoch = reponse["epochnum"]["value"];
        });

        client.CurrentLayer({}, (error: any, reponse: any) => {
          console.log(reponse);
          currentLayer = reponse["layernum"]["number"];
        });

        client.GenesisTime({}, (error: any, reponse: any) => {
          console.log(reponse);
          genesisTime = reponse["unixtime"]["value"];
        });
      } catch (e) {}
    }
  );
}

function sleep(ms: number | undefined) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function timeDiffCalc(dateFuture: any, dateNow: any) {
  let diffInMilliSeconds = Math.abs(dateFuture - dateNow) / 1000;

  // calculate days
  const days = Math.floor(diffInMilliSeconds / 86400);
  diffInMilliSeconds -= days * 86400;
  console.log("calculated days", days);

  // calculate hours
  const hours = Math.floor(diffInMilliSeconds / 3600) % 24;
  diffInMilliSeconds -= hours * 3600;
  console.log("calculated hours", hours);

  // calculate minutes
  const minutes = Math.floor(diffInMilliSeconds / 60) % 60;
  diffInMilliSeconds -= minutes * 60;
  console.log("minutes", minutes);

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
