import {
  getPlayer,
  getPlayerRankingsAtLocation,
  getLocations,
  getPlayerBattles,
} from "./royaleApi";

const config = require("../config.json");
import {
  initOutputDirectory,
  shuffleArray,
  addPlayerToFile,
  count2DArrayElements,
} from "./utils";
import {
  initProgressBar,
  onIterationIncremented,
  onLocationAdded,
  onPlayerAdded,
  stopProgressBars,
} from "./progressBar";

async function getInitialPlayerTagsFromLocations(
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
    onLocationAdded(location.name);
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
      onOpponentAdded(playerTag);
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

  let locations = (await getLocations()).items;
  initProgressBar(locations.length);

  initOutputDirectory();

  let initialPlayerTags = await getInitialPlayerTagsFromLocations(locations);
  let allPlayerTags = [].concat(...initialPlayerTags);
  // code can be injected here for a different starting array of players

  for (let i = 0; i < config.ITERATION_COUNT; i++) {
    let newPlayerTagsByLocation = [];
    let totalPlayerCount = count2DArrayElements(initialPlayerTags);
    onIterationIncremented(totalPlayerCount, initialPlayerTags.length);

    for (const playerTags of initialPlayerTags) {
      onLocationAdded("", playerTags.length);
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
      allPlayerTags.concat(opponentPlayerTags); // add to list of all players
      newPlayerTagsByLocation.push(opponentPlayerTags); // player tags to go through next iteration
    }

    // limit players per location to stack size and choose randomly
    newPlayerTagsByLocation.forEach(function (_, index, arr) {
      arr[index] = shuffleArray(arr[index]).slice(0, config.STACK_SIZE);
    });
    initialPlayerTags = newPlayerTagsByLocation;
  }

  stopProgressBars();
  console.timeEnd("main");
}

main();
