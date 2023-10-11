import { FileChangeInfo, access, constants, readdir, watch } from "fs/promises";
import { log, sendEmail } from "./helpers";
// import yargs from "yargs";

interface Watcher {
  watcher: AsyncIterable<FileChangeInfo<string>>;
  dirPath: string;
  threshold: number;
}

type FileEvent = "create" | "delete";

(async function main() {
  /****************************************************************************************************/
  // CONSTANTS
  /****************************************************************************************************/
  // A map with Directory paths as keys against their max counter as values. E.g. { "/var/log": 10 }
  const directoryCounter: Record<string, number> = {};
  const SNOOZE = parseInt(
    process.env.SNOOZE ?? (process.env.NODE_ENV === "production" ? "60" : "2")
  );

  /****************************************************************************************************/
  // Parse DIRPATH_OPTIONS
  /****************************************************************************************************/
  // E.g. `--dir=/var/log=10,/tmp=20`
  const dir = process.env.DIRPATH_OPTIONS;
  if (!dir) {
    log("error", "Environment variable: DIRPATH_OPTIONS, not found!");
    return;
  }
  const directories = (dir as string).split(",");

  /****************************************************************************************************/
  // Map the directories with the threshold
  /****************************************************************************************************/
  for (const directory of directories) {
    const [d, max] = directory.split("=");
    directoryCounter[d] = parseInt(max) || 10;
  }

  /****************************************************************************************************/
  // Create a watcher for every dirPath provided and store it in a list
  /****************************************************************************************************/
  const watchers: Watcher[] = [];
  for (const [dirPath, threshold] of Object.entries(directoryCounter)) {
    // Create a watcher
    const watcher = watch(dirPath, {
      recursive: process.env.RECURSIVE === "false" ? false : true,
    });
    watchers.push({
      watcher,
      dirPath,
      threshold,
    });
  }

  /****************************************************************************************************/
  // Run all of the watchers concurrently
  /****************************************************************************************************/
  console.log("\x1b[35m%s\x1b[0m", "Running directory watchers...");
  await Promise.all(
    watchers.map(async ({ watcher, dirPath, threshold }) => {
      // Read the default contents of the directory before watch begins
      const files = await readdir(dirPath);
      let counter = files.length;
      let lastEmailedAt = Date.now();
      // Maintain an event queue of only the last 2 event names.
      let eventQ: [FileEvent, FileEvent] = ["create", "create"];

      // If at the time of application launch, there are files in the directory >= threshold, send Email
      if (counter >= threshold) {
        log("info", `Reached file count, ${counter}. Sending Email...`);
        await sendEmail({
          senderName: "Jayanta S",
          name: "Jayanta Samaddar",
          to: "jayanta@zenius.one",
          message: `${counter} files have now accumulated at the directory at "${dirPath}"! Requesting you to take action.`,
          subject: `ALERT: ${counter} files have now accumulated at the directory at "${dirPath}"!`,
        });
      } else {
        // Set clock back by SNOOZE time, so we can immediately send emails upon watch events
        lastEmailedAt = Date.now() - SNOOZE * 60 * 1000;
      }

      // Run each watcher and send email when threshold is breached
      for await (const { eventType, filename } of watcher) {
        // File modifications are referred to as change event. We will skip this event.
        if (eventType == "change") continue;
        const lastEvent = eventQ.pop();

        // We have to check if multiple files are added or removed at the same time, i.e. whether it is a creation or deletion event
        // (a) If creation event, no error when trying to access file.
        // (b) If deletion event, error when trying to access file.
        // Push the type of `FileEvent` to `eventQ`
        try {
          await access(`${dirPath}/${filename}`, constants.R_OK);
          eventQ.unshift("create");
        } catch (e) {
          if (e instanceof Error) {
            eventQ.unshift("delete");
          }
        }
        // Update counter with current count of files in the directory
        counter = (await readdir(dirPath)).length;
        log(
          "info",
          `Number of files in "${dirPath}" updated: ${counter}`,
          false
        );

        // Calculate minutes since last email. We will use this to see if this has equalled or exceeded SNOOZE before sending an email.
        const currentDate = Date.now();
        const minutesSinceLastEmail = (currentDate - lastEmailedAt) / 1000 / 60;

        // These are the following cases when the counter will match the threshold:
        // (a) When files are lesser than the threshold and are added until it reaches the threshhold.
        // (b) When files are greater than the threshold and are removed until it reaches the threshold.
        // We don't want the trigger to work when we are deleting files. That means we were already notified and now we are making corrective actions.
        // We also do not want to send emails if the threshhold is breached immediately. For e.g. threshold was 10, now we are at 11, 12, 13...
        // We don't want emails to go for every single file addition. Thousands of files would mean thousands of emails.
        // Modify the SNOOZE environment variable to set this. Defaults to 60 mins for production and 2 minutes
        if (
          lastEvent !== "delete" &&
          counter >= threshold &&
          minutesSinceLastEmail >= SNOOZE
        ) {
          // While watching files in the directory, if the number of files added exceeds the
          log("info", `Reached file count, ${counter}. Sending Email...`);
          await sendEmail({
            senderName: "Jayanta S",
            name: "Jayanta Samaddar",
            to: "jayanta@zenius.one",
            message: `${counter} files have now accumulated at the directory at "${dirPath}"! Requesting you to take action.`,
            subject: `ALERT: ${counter} files have now accumulated at the directory at "${dirPath}"!`,
          });
          lastEmailedAt = Date.now();
        }
      }
    })
  );
})();
