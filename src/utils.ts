import { config } from "./config";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { appendFile } from "fs/promises";

export function initOutputDirectory() {
  if (!existsSync(config.DATA_PATH)) {
    mkdirSync(config.DATA_PATH, { recursive: true });
  }
  if (!existsSync(config.DATA_PATH + config.PLAYER_TAGS_FILE)) {
    writeFileSync(config.DATA_PATH + config.PLAYER_TAGS_FILE, "");
  }
  if (!existsSync(config.DATA_PATH + config.DUMP_FILE)) {
    writeFileSync(config.DATA_PATH + config.DUMP_FILE, "");
  }
}

export function readApiToken() {
  if (existsSync(config.API_TOKEN_FILE)) {
    let token = readFileSync(config.API_TOKEN_FILE, "utf-8");
    if (token) {
      return token;
    }
  }
  return config.API_TOKEN;
}

export async function addPlayerToFile(
  playerTag: string,
  playerData: {},
  playerBattleLog: any[]
) {
  let currentTimeMs = new Date().valueOf();
  let data = {
    tag: playerTag,
    timestamp: currentTimeMs,
    player: playerData,
    battleLog: playerBattleLog,
  };
  appendFile(config.DATA_PATH + config.DUMP_FILE, JSON.stringify(data) + "\n");
  appendFile(
    config.DATA_PATH + config.PLAYER_TAGS_FILE,
    playerTag + "," + currentTimeMs + "\n"
  );
}

export function shuffleArray<T>(array: T[]): T[] {
  let counter = array.length;

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    let index = Math.floor(Math.random() * counter);

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    let temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }

  return array;
}

export function count2DArrayElements<T>(array: T[][]): number {
  return array
    .map((a) => a.length)
    .reduce(function (pv, cv) {
      return pv + cv;
    }, 0);
}
