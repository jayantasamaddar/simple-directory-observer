import dotenv from "dotenv";
import { mkdir, appendFile } from "fs/promises";
import { dirname } from "path";
dotenv.config({ path: process.env.ENVPATH });

type Logger = "info" | "error";

const LOGS_PATH = process.env.LOGS_PATH || "/tmp/simple-directory-observer";
const LOCALE = process.env.LOCALE || "en-US";

/**
 * Append to file if it exists or writes to a new file. Creates directories recursively if directory doesn't exist.
 * @param filePath string
 * @param data string or object
 */
export const appendToFile = async (
  filePath: string,
  data: string | Record<string, any>
) => {
  try {
    // Ensure the directory exists
    const dirPath = dirname(filePath as string);
    await mkdir(dirPath, { recursive: true });

    // Append data to the file, creating it if it doesn't exist
    await appendFile(
      filePath,
      (typeof data === "string" ? data : JSON.stringify(data)) + "\n"
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
    }
  }
};

/**
 * Generates log data
 * @param type "success" | "error"
 * @param message string
 * @param persist boolean
 * @returns
 */
export const log = async (
  type: Logger,
  message: string,
  persist: boolean = true
) => {
  let str: string;
  switch (type) {
    case "info":
      str =
        "\x1b[34mINFO:\t\x1b[0m" +
        new Date().toLocaleString(LOCALE, {
          timeZone: process.env.TZ || "Asia/Kolkata",
          hour12: false,
          timeZoneName: "short",
        }) +
        `\t${message}`;
      console.log(str);
      break;
    case "error":
      str =
        "\x1b[31mERROR:\t\x1b[0m" +
        new Date().toLocaleString(LOCALE, {
          timeZone: process.env.TZ || "Asia/Kolkata",
          hour12: false,
          timeZoneName: "short",
        }) +
        `\t${message}`;
      console.error(str);
      break;
    default:
      break;
  }

  if (persist) {
    await appendToFile(`${LOGS_PATH}/logs.json`, message);
  }
};
