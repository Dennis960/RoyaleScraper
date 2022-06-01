import { MultiBar, Presets, SingleBar } from "cli-progress";

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { appendFile } from "fs/promises";

import {
  getPlayer,
  getPlayerRankingsAtLocation,
  getLocations,
  getPlayerBattles,
} from "./royaleApi";

import { config } from "../config";

function shuffle<T>(array: T[]): T[] {
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

async function addPlayerToFile(
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
  appendFile(config.DUMP_FILE, JSON.stringify(data) + "\n");
  appendFile(config.PLAYER_TAGS_FILE, playerTag + "," + currentTimeMs + "\n");
}

async function getInitialPlayerTags(
  locationBar: SingleBar,
  locations: [{ isCountry: boolean; id: string; name: string }]
) {
  let playerTagsByCountry: string[][] = [];
  console.log("fetching global rankings");
  for (const location of locations) {
    if (location.isCountry) {
      let locationId: string = location.id;
      let playerRankingObject = await getPlayerRankingsAtLocation(locationId);
      if (playerRankingObject) {
        let playerRankings = playerRankingObject.items;
        let countryPlayerTags: string[] = [];
        for (const player of shuffle(playerRankings)) {
          let playerTag = player.tag;
          countryPlayerTags.push(playerTag);
          if (countryPlayerTags.length == config.STACK_SIZE) {
            break;
          }
        }
        playerTagsByCountry.push(countryPlayerTags);
      }
    }
    if (config.SHOULD_PRINT_PROGRESS) {
      locationBar.increment(1, { name: location.name });
    }
  }
  return playerTagsByCountry;
}

async function main() {
  console.time("main");
  //#region init progress bar
  const multibar = new MultiBar(
    {
      format: "{title} [{bar}] {percentage}% | {name} | {value}/{total}",
      clearOnComplete: false,
      hideCursor: true,
    },
    Presets.shades_grey
  );

  if (!config.SHOULD_PRINT_PROGRESS) {
    multibar.stop();
  }
  //#endregion

  //#region filesystem setup
  if (!existsSync(config.DATA_PATH)) {
    mkdirSync(config.DATA_PATH, { recursive: true });
  }
  if (!existsSync(config.PLAYER_TAGS_FILE)) {
    writeFileSync(config.PLAYER_TAGS_FILE, "");
  }
  if (!existsSync(config.DUMP_FILE)) {
    writeFileSync(config.DUMP_FILE, "");
  }
  //#endregion

  let locationObject = await getLocations();
  if (!locationObject) {
    throw "Cannot get locations";
  }
  let locations = locationObject.items;

  const iterationBar = multibar.create(config.ITERATION_COUNT, 0, {
    title: "Iteration",
    name: "",
  });
  const locationBar = multibar.create(locations.length, 0, {
    title: "Location ",
  });

  let initialPlayerTagsByLocation;
  initialPlayerTagsByLocation = await getInitialPlayerTags(
    locationBar,
    locations
  );
  let allPlayerTags: any[] = [];
  for (const playerTags of initialPlayerTagsByLocation) {
    playerTags.map((tag: string) => allPlayerTags.push(tag));
  }
  // code can be injected here for a different starting array of players

  const totalPlayersBar = multibar.create(0, 0, { title: "Players  " });
  const playerBar = multibar.create(0, 0, { title: "Player   " });
  for (let i = 0; i < config.ITERATION_COUNT; i++) {
    iterationBar.increment();
    let newPlayerTags = [];
    let totalPlayerCount = initialPlayerTagsByLocation
      .map((a) => a.length)
      .reduce(function (pv, cv) {
        return pv + cv;
      }, 0);

    //#region progress bars
    if (config.SHOULD_PRINT_PROGRESS) {
      totalPlayersBar.update(0);
      totalPlayersBar.setTotal(totalPlayerCount);
      locationBar.update(0);
      locationBar.setTotal(initialPlayerTagsByLocation.length);
    }
    //#endregion

    for (const playerTags of initialPlayerTagsByLocation) {
      if (config.SHOULD_PRINT_PROGRESS) {
        playerBar.update(0);
        playerBar.setTotal(playerTags.length);
        locationBar.increment();
      }
      let opponentPlayerTags: any[] = [];
      await Promise.all(
        playerTags.map(async (playerTag: string) => {
          //#region fetch player data
          let promises: [Promise<{} | null>, Promise<any[] | null>] = [
            getPlayer(encodeURIComponent(playerTag)),
            getPlayerBattles(encodeURIComponent(playerTag)),
          ];
          let [playerData, playerBattleLog] = await Promise.all(promises);
          if (config.SHOULD_PRINT_PROGRESS) {
            playerBar.increment({ name: playerTag });
            totalPlayersBar.increment({ name: playerTag });
          }
          //#endregion

          if (playerData && playerBattleLog) {
            addPlayerToFile(playerTag, playerData, playerBattleLog);

            // iterate opponents
            for (const battle of shuffle(playerBattleLog)) {
              let opponentPlayerTag: string = battle["opponent"][0]["tag"];
              // check if tag already in data
              if (!allPlayerTags.includes(opponentPlayerTag)) {
                opponentPlayerTags.push(opponentPlayerTag);
              }
            }
          }
        })
      );
      newPlayerTags.push(opponentPlayerTags);
    }

    newPlayerTags.forEach(function (_, index, arr) {
      arr[index] = shuffle(arr[index]).slice(0, config.STACK_SIZE);
    });
    initialPlayerTagsByLocation = newPlayerTags;
  }

  multibar.stop();
  console.timeEnd("main");
}

main();
