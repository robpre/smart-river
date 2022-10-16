import pathlib from "path";
import fs from "fs";
import type SecretType from "../.secrets.json";
import { APP_NAME, mustGet } from "./config";
import { memo } from "./lib/memo";

class MissingEnvKeyError extends Error {
  code: string;

  constructor(msg: string, code: string) {
    super(`${code}: ${msg}`);

    this.code = code;
  }
}

/**
 * SSR only
 */
export const getSecrets = memo(() => {
  const fullpath = pathlib.join(process.cwd(), ".secrets.json");
  try {
    const contents = fs.readFileSync(fullpath).toString();
    const file = JSON.parse(contents) as SecretType;

    if (!file[APP_NAME]) {
      throw new MissingEnvKeyError(
        `Missing ${APP_NAME} in ${Object.keys(file)}`,
        "MISSING_ENV"
      );
    }

    return {
      vercelAccessKeyId: mustGet(file[APP_NAME], "vercelAccessKeyId"),
      vercelAccessKeySecret: mustGet(file[APP_NAME], "vercelAccessKeySecret"),
      historicReadingsBucket: mustGet(file[APP_NAME], "historicReadingsBucket"),
      appStorageTableName: mustGet(file[APP_NAME], "appStorageTableName"),
    };
  } catch (err) {
    if (err && typeof err == "object" && "code" in err) {
      const errCode = (err as { code: unknown }).code;

      if (errCode === "MODULE_NOT_FOUND" || errCode === "MISSING_ENV") {
        console.warn(`path(${fullpath}) missing data in env, `, err);

        return {
          vercelAccessKeyId: "",
          vercelAccessKeySecret: "",
          historicReadingsBucket: "",
          appStorageTableName: "",
        };
      }
    }

    throw err;
  }
});
