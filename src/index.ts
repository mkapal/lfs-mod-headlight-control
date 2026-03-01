import chalk from "chalk";
import { InSim } from "node-insim";
import {
  AICHeadlights,
  AICInput,
  AIInputVal,
  IS_AIC,
  IS_ISI_ReqI,
  PacketType,
  PlayerType,
} from "node-insim/packets";

import { loadConfig } from "./config";
import { createLog } from "./log";
import { playerTracking } from "./playerTracking";

const config = loadConfig();

console.log(`Connecting to ${config.insim.host}:${config.insim.port}`);

const inSim = new InSim();
inSim.connect({
  IName: "Rain AI",
  Host: config.insim.host,
  Port: config.insim.port,
  Admin: config.insim.admin,
  ReqI: IS_ISI_ReqI.SEND_VERSION,
});

const log = createLog(inSim);

const playersConnections = playerTracking(inSim);

inSim.on(PacketType.ISP_VER, (packet) => {
  if (packet.ReqI !== IS_ISI_ReqI.SEND_VERSION) {
    return;
  }

  console.log(
    chalk.green(`Connected to LFS ${packet.Product} ${packet.Version}`),
  );
  inSim.sendMessage("/msg Rain AI Control InSim connected");
});

inSim.on(PacketType.ISP_RST, () => {
  console.log("Session started");
  turnOnHeadlights();
});

process.on("uncaughtException", (error) => {
  console.error(chalk.red(error));
});

function turnOnHeadlights() {
  console.log("Attempt to turn on headlights for selected AIs");

  playersConnections.players.forEach((player) => {
    const name = player.PName;

    console.log(`Player: ${name}`);

    if ((player.PType & PlayerType.AI) === 0) {
      console.log(`Player ${name} is not an AI - skipping`);
      return;
    }

    if (config.ai.names.includes(name)) {
      log.debug(`Turn on headlights for ${name}`);
      inSim.send(
        new IS_AIC({
          PLID: player.PLID,
          Inputs: [
            new AIInputVal({
              Input: AICInput.CS_HEADLIGHTS,
              Value: AICHeadlights.LOW,
            }),
          ],
        }),
      );
    } else {
      console.log(`Player ${name} is not in the list of AIs`);
    }
  });
}

inSim.on("disconnect", () => {
  console.log("Disconnected from LFS");
  process.exit(1);
});

process.on("SIGINT", () => {
  inSim.disconnect();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:");
  console.error(err);
  inSim.disconnect();
  process.exit(1);
});
