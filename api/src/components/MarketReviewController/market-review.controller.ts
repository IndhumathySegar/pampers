// types
import type { Request, Response } from "express";
import { LeanDocument } from "mongoose";
// util
import MarketReviewHelper from "./market-review.helper";
// entities
import { AuditModel } from "../../entities";

// dto
import { IParams } from "./dto/iMarketReview.dto";

import { IAudit } from "../../entities/interfaces/iAudit";
import AdminPanelHelper from "../AdminPanelController/admin-panel.helper";

class MarketReviewController {
  /**
   * Get all Content Models from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchRegion(req: Request, res: Response): Promise<Response> {
    try {
      const region = await MarketReviewHelper.fetchRegion(
        req.query.environment
      );
      return res.status(200).json({
        region,
        message: "Region Fetched Successfully",
      });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * Get translation history from DB
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchContentTranslationHistory(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { pageIndex = 0, pageSize = 50, sort = -1 } = req.query;

      const dbQuery: any = {
        module: "Market Review",
      };

      const totalCount = await AuditModel.countDocuments(dbQuery).exec();

      const data: LeanDocument<IAudit>[] = await AuditModel.find(dbQuery)
        .sort({ _id: sort })
        .limit(Number(pageSize))
        .skip(Number(pageIndex) * Number(pageSize))
        .lean()
        .exec();

      return res.status(200).json({ data, totalCount });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }

  /**
   * update translation key values to contentful
   * @param {Request} req Request Object
   * @param res
   * @returns {Promise<Response>} Response
   */
  async updateTranslation(req: Request, res: Response): Promise<Response> {
    const { environment } = req.query;
    const { id, replaceValue, initialValue, label, locale, key } = req.body;

    try {
      await MarketReviewHelper.updateEntry(
        id,
        replaceValue,
        locale,
        environment,
        key
      );

      const payload = {
        email: req.user.email,
        module: "Market Review",
        action: `Replace to ${environment}`,
        data: {
          status: "success",
          label,
          id,
          initialValue,
          replaceValue,
          sourceLocale: locale,
          content: `Updated and published entry ${id}`,
        },
        submodule : "Market Review",
        user : req.user,
        status : "Success",
        actionDetails : `Updated and published entry ${id}`, 
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);

      return res.status(200).json({ message: "Updated and published" });
    } catch (ex) {
      const payload = {
        email: req.user.email,
        module: "Market Review",
        action: `Upload to ${environment}`,
        data: {
          status: "failed",
          label,
          initialValue,
          replaceValue,
          sourceLocale: locale,
          destLocale: locale,
          content: ex.message,
        },
        submodule : "Market Review",
        user : req.user,
        status : "Error",
        errorDetails : ex,
        actionDetails :`Failed to update and publish entry ${id}`, 
        reqPayload : req.body
      };
      await AdminPanelHelper.createAuditTrail(payload);
      return res.status(500).json({
        message: ex.message,
        type: "failed",
      });
    }
  }

  /**
   * Get all Content Models from Contentful
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async fetchContentModel(req: Request, res: Response): Promise<Response> {
    try {
      const {
        sourceLocale = "en-US",
        environment = "dev-staging-content",
        pageSize = 5,
        pageIndex = 0,
        filter,
      } = req.body as IParams;

      const contentModel = await MarketReviewHelper.fetchContentModel(
        environment
      );

      const { entries, totalEntries } = await MarketReviewHelper.fetchEntries(
       { currentEnv: environment,
        filter,
        pageSize,
        pageIndex,
        contentModel,
        sourceLocale,
        destination: "en-US", entryIds: [], isReviewPage: false}
      );

      return res.status(200).json({
        data: entries,
        total: totalEntries,
        message: "Content Models Fetched Successfully",
      });
    } catch (ex: any) {
      return res.status(500).json({ error: ex.message });
    }
  }
}

export default new MarketReviewController();
