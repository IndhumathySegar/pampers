import { join } from "path";
import { get } from "lodash";
import moment from "moment";
import { schedule } from "node-cron";
import { existsSync, mkdirSync, unlinkSync, readdirSync } from "fs";

import { ContentfulMigration } from "../lib";
import { AuditModel, ContentfulMigrationModel } from "../entities";

// interfaces
import { IContentfulMigration } from "../entities/interfaces/iContentfulMigration";

if (!existsSync(join(__dirname, "../contentful-error-logs"))) {
  console.log(mkdirSync(join(__dirname, "../contentful-error-logs")));
}

const INIT_CONTENTFUL_MIGRATION = get(process.env, "INIT_CONTENTFUL_MIGRATION");
const INIT_ROLLBACK_CONTENTFUL_MIGRATION = get(
  process.env,
  "INIT_ROLLBACK_CONTENTFUL_MIGRATION"
);

module.exports = () => {
  // contentful migration scheduler
  schedule("0 */2 * * * *", async () => {
    if (INIT_CONTENTFUL_MIGRATION !== "true") {
      console.log("Skipping contentful migration");
      return;
    }

    console.log("CONTENTFUL CRON INITIATED TESTING");
    try {
      const migration: IContentfulMigration | null =
        await ContentfulMigrationModel.findOne({
          $and: [
            { status: "pending" },
            {  $or: [
              { isCatalogue: false },
              { isCatalogue: { $exists: false } },
            ], },
            {
              $or: [
                { isCRM: false },
                { isCRM: null },
                { isCRM: { $exists: false } },
              ],
            },
          ],
        }).exec();
      if (!migration) {
        return;
      }

      console.log(migration);
      await ContentfulMigration.migrate(migration);
    } catch (ex: any) {
      console.log("[CONTENTFUL CRON FAILURE]", ex);
    }
  });

    // contentful migration scheduler
    schedule("0 */2 * * * *", async () => {
      if (INIT_ROLLBACK_CONTENTFUL_MIGRATION !== "true") {
        console.log("Skipping contentful rollback migration");
        return;
      }
      console.log("CONTENTFUL ROLLBACK CRON INITIATED TESTING");
      try {
        const migration: IContentfulMigration | null =
          await ContentfulMigrationModel.findOne({
            rollBackStatus: "pending",
            project: { $ne: "Pampers Catalog" },
            $or: [
              { isCRM: false },
              { isCRM: null },
              { isCRM: { $exists: false } },
            ],
          }).exec();
        if (!migration) {
          return;
        }
        console.log(migration);
        await ContentfulMigration.migrateBackupRestore(migration);
      } catch (ex: any) {
        console.log("[CONTENTFUL CRON FAILURE]", ex);
      }
    });

  // contentful migration cleanup
  schedule("0 */2 * * * *", async () => {
    try {
      await AuditModel.updateMany(
        {
          $and: [
            {
              module: { $in: ["Content Translation", "CRM Translation"] },
              "data.status": "pending",
              createdAt: { $lte: moment().subtract(5, "minutes").toDate() },
            },
          ],
        },
        {
          $set: {
            "data.status": "failed",
            error: "Timeout",
          },
        }
      ).exec();
    } catch (ex: any) {
      console.log("[CONTENTFUL CLEANUP CRON FAILURE]", ex);
    }
  });

  // cleanup contentful error logs
  schedule("0 */1 * * * *", () => {
    const errorLogFiles: string[] = readdirSync(
      join(__dirname, "../contentful-error-logs")
    );

    errorLogFiles.forEach((errorLogFile: string) => {
      try {
        unlinkSync(join(__dirname, `../contentful-error-logs/${errorLogFile}`));
      } catch (_: any) {}
    });
  });
};
