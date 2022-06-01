const config = require("../config.json");
import { MultiBar, Presets, SingleBar } from "cli-progress";

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
