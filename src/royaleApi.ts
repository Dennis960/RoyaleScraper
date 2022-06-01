import fetch from "node-fetch";
import { Agent as HttpsAgent } from "https";

const config = require("../config.json");
const fetchthrottle = require("fetch-throttle");
let throttler = fetchthrottle(fetch, 80, 1000);

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  keepAliveMsecs: 90 * 60,
});

export async function fetchJsonFromApi<T>(query: String) {
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
      return jsonData as T;
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
export async function getPlayer(playerTag: String) {
  return await fetchJsonFromApi<{}>("players/" + playerTag);
}
export async function getPlayerBattles(playerTag: String) {
  return await fetchJsonFromApi<any[]>("players/" + playerTag + "/battlelog");
}
export async function getPlayerUpcomingChests(playerTag: String) {
  return await fetchJsonFromApi("players/" + playerTag + "/upcomingchests");
}
//#endregion

//#region Clans
export async function getClan(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag);
}
export async function getClanWarlog(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/warlog");
}
export async function getClanRiverracelog(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/riverracelog");
}
export async function getClanCurrentwar(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/currentwar");
}
export async function getClanMembers(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/members");
}
export async function getClanCurrentriverrace(clanTag: String) {
  return await fetchJsonFromApi("clans/" + clanTag + "/currentriverrace");
}
export async function getClansBySearchName(search: String) {
  return await fetchJsonFromApi("clans?name=" + search);
}
//#endregion

//#region Cards
export async function getCards() {
  return await fetchJsonFromApi("cards");
}
//#endregion

//#region Tournaments
export async function getTournament(tournamentTag: String) {
  return await fetchJsonFromApi("tournaments/" + tournamentTag);
}
export async function getTournamentsBySearchName(search: String) {
  return await fetchJsonFromApi("tournaments?name=" + search);
}
//#endregion

//#region Locations
export async function getLocationGlobalTournamentRankings(
  tournamentTag: String
) {
  return await fetchJsonFromApi(
    "locations/global/rankings/tournaments/" + tournamentTag
  );
}
export async function getLocations() {
  let locations = await fetchJsonFromApi<{
    items: [
      {
        isCountry: boolean;
        id: string;
        name: string;
      }
    ];
  }>("locations");
  if (!locations) {
    throw "Locations not found";
  }
  return locations;
}
export async function getPlayerRankingsAtLocation(locationId: String) {
  return await fetchJsonFromApi<{
    items: [
      {
        tag: string;
      }
    ];
  }>("locations/" + locationId + "/rankings/players");
}
//#endregion
