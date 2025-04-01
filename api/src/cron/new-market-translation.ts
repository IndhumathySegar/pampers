import { schedule } from "node-cron";
import { NewMarketContentful } from "../lib";
import { ITranslationHistory } from "../entities/interfaces/iTranslationHistory";
import { TransactionHistoryModel } from "../entities";

module.exports = () => {
  schedule("0 */1 * * * *", async () => {
    console.log("New market translation job started");
    try {
      const startedTranslations = await TransactionHistoryModel.findOne({
        status: "started",
      }).exec();
      if (startedTranslations) {
        console.log("returning because started");
        return;
      }

      const transactionHistory: ITranslationHistory | null =
        await TransactionHistoryModel.findOne({ status: "enqueued" })
          .sort({ _id: 1 })
          .limit(1)
          .exec();
          console.log(transactionHistory);

      if (!transactionHistory) {
        return;
      }

      if (transactionHistory.byTags) {
        await NewMarketContentful.beginMarketTranslationByTags(transactionHistory);
      } else {
        await NewMarketContentful.beginMarketTranslation(transactionHistory);
      }
    } catch (ex: any) {
      console.log("[CONTENTFUL CRON FAILURE]", ex);
    }
  });
};
