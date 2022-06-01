import { appendFile } from "fs/promises";

import {
  getPlayer,
  getPlayerRankingsAtLocation,
  getLocations,
  getPlayerBattles,
} from "./royaleApi";

import { config } from "../config";
import {
  initFiles,
  initProgressBar,
  shuffleArray,
  onIterationIncremented,
  onLocationAdded,
  onPlayerAdded,
  stopProgressBars,
} from "./utils";

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
        for (const player of shuffleArray(playerRankings)) {
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
      onLocationAdded(location.name);
    }
  }
  return playerTagsByCountry;
}

async function getAllOpponents(
  playerTags: string[],
  onOpponentAdded: Function
) {
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
        onOpponentAdded(playerTag);
      }
      //#endregion
      if (playerData && playerBattleLog) {
        addPlayerToFile(playerTag, playerData, playerBattleLog);

        // iterate opponents
        for (const battle of shuffleArray(playerBattleLog)) {
          let opponentPlayerTag: string = battle["opponent"][0]["tag"];
          opponentPlayerTags.push(opponentPlayerTag);
        }
      }
    })
  );
  return opponentPlayerTags;
}

async function main() {
  console.time("main");

  let locationObject = await getLocations();
  if (!locationObject) {
    throw "Cannot get locations";
  }
  let locations = locationObject.items;
  initProgressBar(locations.length);

  initFiles();

  let initialPlayerTagsByLocation: string[][];
  initialPlayerTagsByLocation = await getInitialPlayerTags(locations);
  let allPlayerTags: any[] = [];
  for (const playerTags of initialPlayerTagsByLocation) {
    playerTags.map((tag: string) => allPlayerTags.push(tag));
  }
  // code can be injected here for a different starting array of players

  for (let i = 0; i < config.ITERATION_COUNT; i++) {
    let newPlayerTagsByLocation = [];
    let totalPlayerCount = initialPlayerTagsByLocation
      .map((a) => a.length)
      .reduce(function (pv, cv) {
        return pv + cv;
      }, 0);

    onIterationIncremented(
      totalPlayerCount,
      initialPlayerTagsByLocation.length
    );

    for (const playerTags of initialPlayerTagsByLocation) {
      if (config.SHOULD_PRINT_PROGRESS) {
        onLocationAdded("", playerTags.length);
      }
      let opponentPlayerTags: any[] = await getAllOpponents(
        playerTags,
        onPlayerAdded
      );
      // remove duplicates
      opponentPlayerTags = [
        ...new Set(
          opponentPlayerTags.filter(function (el) {
            return !allPlayerTags.includes(el);
          })
        ),
      ];
      allPlayerTags.concat(opponentPlayerTags);
      newPlayerTagsByLocation.push(opponentPlayerTags);
    }

    newPlayerTagsByLocation.forEach(function (_, index, arr) {
      arr[index] = shuffleArray(arr[index]).slice(0, config.STACK_SIZE);
    });
    initialPlayerTagsByLocation = newPlayerTagsByLocation;
  }

  stopProgressBars();
  console.timeEnd("main");
}

main();
