import { join } from "path";

import moment from "moment";
import { schedule } from "node-cron";
import { existsSync, mkdirSync} from "fs";

import { ContentfulRegionMapping } from "../lib";
import { ContentfulRegionMappingModel } from "../entities";

if (!existsSync(join(__dirname, "../contentful-error-logs"))) {
  console.log(mkdirSync(join(__dirname, "../contentful-error-logs")));
}

module.exports = () => {
  // contentful migration scheduler
  schedule("0 */2 * * * *", async () => {
    console.log("CONTENTFUL REGION MAPPING CRON INITIATED TESTING");
    try {
      const regionData = await ContentfulRegionMappingModel.findOne({
        status: "pending",
      }).exec();
      if (!regionData) {
        return;
      }

      console.log(regionData);
      await ContentfulRegionMapping.getRecords(regionData);

    } catch (ex: any) {
      console.log("[CONTENTFUL CRON FAILURE]", ex);
    }
  });

  // contentful migration cleanup
  schedule("0 */2 * * * *", async () => {
    try {
      await ContentfulRegionMappingModel.updateMany(
        {
          $and: [
            {
              status: "started",
              updatedAt: { $lte: moment().subtract(10, "minutes").toDate() },
            },
          ],
        },
        {
          $set: {
            status: "failed",
            errorDetails: [{ error: "Timeout" }],
          },
        }
      ).exec();
    } catch (ex: any) {
      console.log("[CONTENTFUL REGION MAPPING CLEANUP CRON FAILURE]", ex);
    }
  });
};
