const config = require("../config.json");
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { MultiBar, Presets, SingleBar } from "cli-progress";

export function initFiles() {
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

let multibar: MultiBar;
let playerBar: SingleBar,
  totalPlayersBar: SingleBar,
  iterationBar: SingleBar,
  locationBar: SingleBar;

export function initProgressBar(locationsCount: number) {
  if (config.SHOULD_PRINT_PROGRESS) {
    multibar = new MultiBar(
      {
        format: "{title} [{bar}] {percentage}% | {name} | {value}/{total}",
        clearOnComplete: false,
        hideCursor: true,
      },
      Presets.shades_grey
    );

    iterationBar = multibar.create(config.ITERATION_COUNT, 0, {
      title: "Iteration",
      name: "",
    });
    locationBar = multibar.create(locationsCount, 0, {
      title: "Location ",
    });
    totalPlayersBar = multibar.create(1, 0, { title: "Players  " });
    playerBar = multibar.create(1, 0, { title: "Player   " });
  }
}
export function onPlayerAdded(playerTag: string) {
  if (config.SHOULD_PRINT_PROGRESS) {
    playerBar.increment({ name: playerTag });
    totalPlayersBar.increment({ name: playerTag });
  }
}

export function onLocationAdded(locationName: string, playerCount: number = 1) {
  if (config.SHOULD_PRINT_PROGRESS) {
    locationBar.increment({ name: locationName });
    playerBar.setTotal(playerCount);
    playerBar.update(0);
  }
}
export function onIterationIncremented(
  totalPlayerCount: number,
  locationsCount: number
) {
  if (config.SHOULD_PRINT_PROGRESS) {
    iterationBar.increment();
    totalPlayersBar.update(0);
    totalPlayersBar.setTotal(totalPlayerCount);
    locationBar.update(0);
    locationBar.setTotal(locationsCount);
  }
}

export function stopProgressBars() {
  if (config.SHOULD_PRINT_PROGRESS) {
    multibar.stop();
  }
}
