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

let netId: any, currentEpoch: any, currentLayer: any, genesisTime: any;

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

    let oldmsg = await channel.messages.fetch("953365375528075274");

    if (oldmsg) networkStatusMsg = oldmsg;
    else networkStatusMsg = await channel.send(networkStatusEmbed);

    while (1) {
      try {
        getData();
        networkStatusEmbed = await getMsg();
      } catch (e) {
        console.log(`Err: ${e}`);
      }
      networkStatusMsg.edit(networkStatusEmbed);
      await sleep(30 * 1000);
    }
  });
  client.on("error", (error: any) => {
    console.log(error);
  });
}

const getMsg = async () => {
  let netStatus;
  if (typeof currentLayer != "undefined") netStatus = "online";
  else netStatus = "offline";
  const networkStatusEmbed = {
    embeds: [
      {
        type: "rich",
        title: `Network Status - ${netStatus}`,
        thumbnail: {
          url: `https://platform.spacemesh.io/favicon.png`,
          height: 50,
          width: 50,
        },
        description: `**Network ID**\n\`${netId}\` \u3000 \n**Current Epoch**\n\`${currentEpoch}\` \u3000 \n**Current Layer**\n\`${currentLayer}\` \u3000 \n**Genesis time**\n\`${new Date(
          genesisTime * 1000
        ).toLocaleString("en-US")}\` \u3000`,
        color: 0x0095ff,
        timestamp: new Date(),
        footer: {
          text: `Keep smeshing ❤️`,
          icon_url: `https://platform.spacemesh.io/favicon.png`,
        },
      },
    ],
  };

  return networkStatusEmbed;
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

      if (!error && res.statusCode == 200) {
        networkUrl = res.body[0]["grpcAPI"].slice(0, -1).substring(8);
      }

      console.log(networkUrl);

      const meshProto =
        grpc.loadPackageDefinition(packageDefinition).spacemesh.v1;
      const client = new meshProto.MeshService(
        `${networkUrl}:443`,
        grpc.credentials.createSsl()
      );

      client.NetID({}, (error: any, reponse: any) => {
        console.log(reponse["netid"]["value"]);
        netId = reponse["netid"]["value"];
      });

      client.CurrentEpoch({}, (error: any, reponse: any) => {
        console.log(reponse["epochnum"]["value"]);
        currentEpoch = reponse["epochnum"]["value"];
      });

      client.CurrentLayer({}, (error: any, reponse: any) => {
        console.log(reponse["layernum"]["number"]);
        currentLayer = reponse["layernum"]["number"];
      });

      client.GenesisTime({}, (error: any, reponse: any) => {
        console.log(reponse["unixtime"]["value"]);
        genesisTime = reponse["unixtime"]["value"];
      });
    }
  );
}

function sleep(ms: number | undefined) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
