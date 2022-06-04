import { writeFile, readFile } from "fs/promises";
import * as fs from "fs";
import * as readline from "readline";
import { Presets, SingleBar } from "cli-progress";

import { config } from "../src/config";

let FILE_PATH = config.DATA_PATH + config.DUMP_FILE;

function isObject(obj: any): boolean {
  return (
    typeof obj === "object" &&
    obj !== null &&
    obj !== undefined &&
    !Array.isArray(obj)
  );
}
function isArray(obj: any): obj is any[] {
  return Array.isArray(obj) && !(typeof obj === "string");
}
function isValue(obj: any): boolean {
  return !isObject(obj) && !isArray(obj);
}
function isUndefined(obj: any): obj is undefined {
  return obj === undefined;
}

function mergeObjects(objA: any, objB: any): any {
  if (isObject(objA) && isObject(objB)) {
    let mergedObject: any = {};
    let keysA = Object.keys(objA);
    let keysB = Object.keys(objB);
    let allKeys = [...new Set(keysA.concat(keysB))];
    for (let key of allKeys) {
      mergedObject[key] = mergeObjects(objA[key], objB[key]);
    }
    return mergedObject;
  }
  if ((isObject(objA) && isArray(objB)) || (isArray(objA) && isObject(objB))) {
    let arr: any[] = isArray(objA) ? objA : objB;
    const obj: any = isObject(objA) ? objA : objB;
    arr = mergeArray(arr);
    for (let i = 0; i < arr.length; i++) {
      const o = arr[i];
      if (isObject(o)) {
        arr[i] = mergeObjects(o, obj);
      }
    }
    return arr;
  }
  if (isArray(objA) && isArray(objB)) {
    const AllElements = objA.concat(objB);
    return mergeArray(AllElements);
  }
  if ((isValue(objA) && isObject(objB)) || (isObject(objA) && isValue(objB))) {
    return [objA, objB];
  }
  if ((isValue(objA) && isArray(objB)) || (isArray(objA) && isValue(objB))) {
    if (isArray(objA)) {
      objA = mergeArray(objA);
      return [...new Set(objA.concat([objB]))];
    } else if (isArray(objB)) {
      objB = mergeArray(objB);
      return [...new Set(objB.concat([objA]))];
    }
  }
  if (isValue(objA) && isValue(objB)) {
    return objA == objB ? objA : [objA, objB];
  }
  if (isUndefined(objA)) {
    if (isObject(objB) || isValue(objB)) {
      return [null, objB];
    }
    if (isUndefined(objB)) {
      return null;
    }
    if (isArray(objB)) {
      return mergeArray(objB.concat([null]));
    }
  }
  if (isUndefined(objB)) {
    if (isObject(objA) || isValue(objA)) {
      return [null, objA];
    }
    if (isUndefined(objA)) {
      return null;
    }
    if (isArray(objA)) {
      return mergeArray(objA.concat([null]));
    }
  }
  throw "something seems to be not implemented";
}

function mergeArray(allElements: any[]): any {
  let mergedValues: any[] = [];
  let mergedObject: any = {};
  let includesUndefined = false;
  for (const obj of allElements) {
    if (isValue(obj)) {
      if (mergedValues.length == 0) {
        mergedValues.push(obj);
        continue;
      }
      if (mergedValues.includes(obj)) {
        continue;
      }
      mergedValues.push(obj);
    }
    if (isObject(obj)) {
      if (Object.keys(mergedObject).length == 0) {
        mergedObject = obj;
        continue;
      }
      mergedObject = mergeObjects(mergedObject, obj);
    }
    if (isUndefined(obj)) {
      includesUndefined = true;
    }
  }
  let outArray: any[] = [];
  if (mergedValues.length > 0) {
    outArray = outArray.concat(mergedValues);
  }
  if (Object.keys(mergedObject).length > 0) {
    outArray = outArray.concat([mergedObject]);
  }
  if (includesUndefined || outArray.length == 0) {
    outArray = outArray.concat([null]);
  }
  return outArray;
}

function generateSchemaFromObject(obj: any): any {
  if (typeof obj === "string") {
    return { string: [obj] };
  } else if (Array.isArray(obj)) {
    if (obj.length > 0) {
      return obj.map((element) => generateSchemaFromObject(element));
    } else {
      return [];
    }
  } else if (typeof obj === "object" && obj !== null) {
    let schema: any = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      schema[key] = generateSchemaFromObject(obj[key]);
    }
    return schema;
  }
  return { [typeof obj]: [obj] };
}

const jsonCount = 200;
async function main() {
  const bar = new SingleBar({}, Presets.shades_classic);
  bar.start(jsonCount, 0);
  const fileStream = fs.createReadStream(FILE_PATH, "utf-8");

  const lines = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let i = 0;
  let mainSchema: any = {};
  for await (const line of lines) {
    const jsonSchema = generateSchemaFromObject(JSON.parse(line));
    if (i == 0) {
      i += 1;
      mainSchema = jsonSchema;
      continue;
    }
    mainSchema = mergeObjects(mainSchema, jsonSchema);
    i += 1;
    bar.increment();
    writeFile(
      config.DATA_PATH + config.SCHEMA_FILE,
      JSON.stringify(mainSchema)
    );
    if (i > jsonCount) {
      break;
    }
  }
  bar.stop();
}

main();

console.log(
  JSON.stringify(
    mergeObjects(
      {
        prop1: [
          {
            "props1.2": {
              string: ["test"],
            },
          },
          null,
        ],
      },
      {
        prop1: [
          {
            "props1.2": {
              string: ["test"],
            },
          },
        ],
      }
    )
  )
);
