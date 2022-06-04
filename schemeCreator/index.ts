import { writeFile } from "fs/promises";
import * as fs from "fs";
import * as readline from "readline";
import { Presets, SingleBar } from "cli-progress";

import { config } from "../src/config";

let FILE_PATH = config.DATA_PATH + config.DUMP_FILE;

function isObject(obj: any): boolean {
  return typeof obj === "object" && obj !== null && !Array.isArray(obj);
}

function mergeArrays(array1: any[], array2: any[]): any[] {
  // remove null
  let includesNull = array1.includes(null) || array2.includes(null);
  array1 = array1.filter((o) => o !== null);
  array2 = array2.filter((o) => o !== null);
  // merge all objects
  if (array1.length == 0 || array2.length == 0) {
    if (array1.length == 0 && array2.length == 0) {
      return [null];
    }
  }
  let mergedObject = null;
  if (array1.length == 0) {
    mergedObject = array2[0];
  } else {
    mergedObject = array1[0];
  }
  for (let i = 1; i < array1.length; i++) {
    const o = array1[i];
    mergedObject = mergeObjects(mergedObject, o);
  }
  for (let i = 0; i < array2.length; i++) {
    const o = array2[i];
    mergedObject = mergeObjects(mergedObject, o);
  }
  // add null
  let mergedArray = includesNull ? [null] : [];
  if (Array.isArray(mergedObject)) {
    mergedArray = mergedArray.concat(mergedObject);
  } else {
    mergedArray.push(mergedObject);
  }
  return mergedArray;
}

function mergeObjects(destObj: any, obj: any): any {
  if (destObj === undefined) {
    destObj = null;
  }
  if (obj === undefined) {
    obj = null;
  }
  if (Array.isArray(destObj) || Array.isArray(obj)) {
    if (Array.isArray(destObj) && Array.isArray(obj)) {
      return mergeArrays(destObj, obj);

      // let includesNull = destObj.includes(null) || obj.includes(null);
      // let mergedArray = includesNull ? [null] : [];
      // destObj = destObj.filter((o) => o !== null);
      // obj = obj.filter((o) => o !== null);
      // if (destObj)
      // if (destObj.length > 1) {
      //   let mergedObject = destObj[0];
      //   for (let i = 1; i < destObj.length; i++) {
      //     mergedObject = mergeObjects(mergedObject, destObj[i]);
      //   }
      //   destObj = [mergedObject];
      // }
      // if (obj.length > 1) {
      //   let mergedObject = obj[0];
      //   for (let i = 1; i < obj.length; i++) {
      //     mergedObject = mergeObjects(mergedObject, obj[i]);
      //   }
      //   obj = [mergedObject];
      // }
      // if (destObj.length == 1 && obj.length == 1) {
      //   if (isObject(destObj) && isObject(obj)) {
      //     return mergedArray.concat(mergeObjects(destObj[0], obj[0]));
      //   } else {
      //     return mergedArray.concat([destObj, obj]);
      //   }
      // }
      // return mergedArray.concat([...new Set(destObj.concat(obj))] as any[]);
    } else {
      if (isObject(destObj) || isObject(obj)) {
        let array: any[] = [];
        let mergedObject: any;
        if (Array.isArray(destObj)) {
          array.concat(destObj);
          mergedObject = obj;
        } else {
          array.concat(obj);
          mergedObject = destObj;
        }
        for (let i = 0; i < array.length; i++) {
          const o = array[i];
          mergedObject = mergeObjects(mergedObject, o);
        }
        return mergedObject;
      }
      if (Array.isArray(destObj)) {
        destObj.push(obj);
        return [...new Set(destObj)];
      } else {
        obj.push(destObj);
        return [...new Set(obj)];
      }
    }
  }

  if (destObj === null || obj === null) {
    if (Array.isArray(destObj)) {
      return destObj.push(null);
    } else if (Array.isArray(obj)) {
      return obj.push(null);
    } else {
      return [destObj, obj];
    }
  }
  if (isObject(destObj) || isObject(obj)) {
    if (isObject(destObj) && isObject(obj)) {
      let destKeys = Object.keys(destObj);
      let objKeys = Object.keys(obj);
      let allKeys = [...new Set(destKeys.concat(objKeys))];
      for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        destObj[key] = mergeObjects(destObj[key], obj[key]);
      }
      return destObj;
    } else {
      return [destObj, obj];
    }
  }
  return [destObj, obj];
}

function generateSchemeFromObject(obj: any): any {
  if (typeof obj === "string") {
    return { string: [obj] };
  } else if (Array.isArray(obj)) {
    if (obj.length > 0) {
      return obj.map((element) => generateSchemeFromObject(element));
    } else {
      return [];
    }
  } else if (typeof obj === "object" && obj !== null) {
    let scheme: any = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      scheme[key] = generateSchemeFromObject(obj[key]);
    }
    return scheme;
  }
  return { [typeof obj]: [obj] };
}

async function main() {
  const bar = new SingleBar({}, Presets.shades_classic);
  bar.start(50, 0);
  const fileStream = fs.createReadStream(FILE_PATH, "utf-8");

  const lines = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let i = 0;
  let mainScheme: any = {};
  for await (const line of lines) {
    const jsonScheme = generateSchemeFromObject(JSON.parse(line));
    if (i == 0) {
      i += 1;
      mainScheme = jsonScheme;
      continue;
    }
    mainScheme = mergeObjects(mainScheme, jsonScheme);
    i += 1;
    bar.increment();
    writeFile(
      config.DATA_PATH + config.SCHEME_FILE,
      JSON.stringify(mainScheme)
    );
    if (i > 50) {
      break;
    }
  }
}

main();
