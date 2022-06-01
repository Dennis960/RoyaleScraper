import fetch from "node-fetch";
import { MultiBar, Presets } from "cli-progress";

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { appendFile } from "fs/promises";

import { Agent as HttpsAgent } from "https";

const config = require("../config");
const fetchthrottle = require("fetch-throttle");

let throttler = fetchthrottle(fetch, 80, 1000);

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 90 * 60,
});

let STACK_SIZE = 4; // amount of players to check each iteration per country
const ITERATION_COUNT = 20; // amount of iterations

async function fetchJsonFromApi(query: String) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await throttler(config.API_URL + query, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.API_TOKEN,
      },
      agent: httpsAgent,
      compress: true,
    });

    if (response.status == 200) {
      const jsonData = await response.json();
      return jsonData;
    } else if (response.status != 429) {
      return null;
    } else {
      console.log("429");
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

//#region Player
async function getPlayer(playerTag: String) {
  return await fetchJsonFromApi("players/" + playerTag);
}
async function getPlayerBattles(playerTag: String) {
  return await fetchJsonFromApi("players/" + playerTag + "/battlelog");
}
async function getPlayerUpcomingChests(playerTag: String) {
  return await fetchJsonFromApi("players/" + playerTag + "/upcomingchests");
}
//#endregion

//#region Clans
async function getClan(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag);
}
async function getClanWarlog(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/warlog");
}
async function getClanRiverracelog(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/riverracelog");
}
async function getClanCurrentwar(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/currentwar");
}
async function getClanMembers(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/members");
}
async function getClanCurrentriverrace(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/currentriverrace");
}
async function getClansBySearchName(search: String) {
  return await fetchJsonFromApi("clans?name=" + search);
}
//#endregion

//#region Cards
async function getCards() {
  return await fetchJsonFromApi("cards");
}
//#endregion

//#region Tournaments
async function getTournament(tournamentTag: String) {
  return await fetchJsonFromApi("tournaments/" + tournamentTag);
}
async function getTournamentsBySearchName(search: String) {
  return await fetchJsonFromApi("tournaments?name=" + search);
}
//#endregion

//#region Locations
async function getLocationGlobalTournamentRankings(tournamentTag: String) {
  return await fetchJsonFromApi(
    "locations/global/rankings/tournaments/" + tournamentTag
  );
}
async function getLocations() {
  return await fetchJsonFromApi("locations");
}
async function getPlayerRankingsAtLocation(locationId: String) {
  return await fetchJsonFromApi(
    "locations/" + locationId + "/rankings/players"
  );
}
//#endregion

function shuffle(array: any) {
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
  playerTag: any,
  playerData: any,
  playerBattleLog: any
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

async function getInitialPlayerTags(locationBar: any, locations: any) {
  let playerTagsByCountry: any[] = [];
  console.log("fetching global rankings");
  for (const location of locations) {
    if (location["isCountry"]) {
      let locationId = location["id"];
      let playerRankings = await getPlayerRankingsAtLocation(locationId);
      if (playerRankings) {
        playerRankings = playerRankings["items"];
        let countryPlayerTags = [];
        for (const player of shuffle(playerRankings)) {
          let playerTag = player["tag"];
          countryPlayerTags.push(playerTag);
          if (countryPlayerTags.length == STACK_SIZE) {
            break;
          }
        }
        playerTagsByCountry.push(countryPlayerTags);
      }
    }
    if (config.SHOULD_PRINT_PROGRESS) {
      locationBar.increment(1, { name: location["name"] });
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

  let locations = await getLocations();
  locations = locations["items"];

  const iterationBar = multibar.create(ITERATION_COUNT, 0, {
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
    playerTags.map((tag: any) => allPlayerTags.push(tag));
  }
  // code can be injected here for a different starting array of players

  const totalPlayersBar = multibar.create(0, 0, { title: "Players  " });
  const playerBar = multibar.create(0, 0, { title: "Player   " });
  for (let i = 0; i < ITERATION_COUNT; i++) {
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
        playerTags.map(async (playerTag: any) => {
          //#region fetch player data
          let promises = [
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
              let opponentPlayerTag: any = battle["opponent"][0]["tag"];
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

    newPlayerTags.forEach(function (_, index, arr: any) {
      arr[index] = shuffle(arr[index]).slice(0, STACK_SIZE);
    });
    initialPlayerTagsByLocation = newPlayerTags;
  }

  multibar.stop();
  console.timeEnd("main");
}

main();
