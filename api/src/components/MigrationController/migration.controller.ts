import type { Request, Response } from "express";
import ContentfulMigrationModel from "../../entities/contentful-migration";

class MigrationController {
  /**
   * Get all projects from Contentful
   * @param {Request} _ Request Object
   * @param {Response} res Response Object
   * @return {Promise<Response>} Response
   */
  async getPublishedDate(_: Request, res: Response): Promise<Response> {
    try {
      const { includeTags, excludeTags, contentModels, localesToMigrate } =
        _.body;

      if (!localesToMigrate || localesToMigrate?.length === 0) {
        return res.status(400).json({ error: "Locales not be empty" });
      }

      // Split request values into arrays
      const includeTagsArray = includeTags ? includeTags.split(",") : [];
      const excludeTagsArray = excludeTags ? excludeTags.split(",") : [];

      const conditions: any[] = [
        ...(includeTagsArray?.length > 0 ? [{
          $expr: {
            $and: [
              { $gt: [{ $size: { $ifNull: [{ $split: ["$query.includeTags", ","] }, []] } }, 0] }, // Ensure DB field is not empty
              {
                $allElementsTrue: {
                  $map: {
                    input: includeTagsArray,
                    as: "tag",
                    in: {
                      $in: [
                        "$$tag",
                        {
                          $cond: {
                            if: { $gt: [{ $type: "$query.includeTags" }, "null"] },
                            then: { $split: ["$query.includeTags", ","] },
                            else: [],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        }] : []),
      
        ...(excludeTagsArray?.length > 0 ? [{
          $expr: {
            $and: [
              { $gt: [{ $size: { $ifNull: [{ $split: ["$query.excludeTags", ","] }, []] } }, 0] }, // Ensure DB field is not empty
              {
                $allElementsTrue: {
                  $map: {
                    input: excludeTagsArray,
                    as: "tag",
                    in: {
                      $in: [
                        "$$tag",
                        {
                          $cond: {
                            if: { $gt: [{ $type: "$query.excludeTags" }, "null"] },
                            then: { $split: ["$query.excludeTags", ","] },
                            else: [],
                          },
                        },
                      ],
                    },
                  },
                },
              },
            ],
          },
        }] : []),
      
        ...(contentModels?.length > 0 ? contentModels.map((model: string) => ({
          contentModels: { $in: [model] },
        })) : []),
      
        ...(localesToMigrate?.length > 0 ? localesToMigrate.map((locale: string) => ({
          localesToMigrate: { $in: [locale] },
        })) : []),
      ];
      
      // Build the final query with a top-level $and
      const finalCondition: any = {
        status: "success",
        $and: conditions.length > 0 ? conditions : [{ $expr: { $eq: [1, 1] } }], // Always true if no conditions
      };
      
      const migrationData: any = await ContentfulMigrationModel.findOne(finalCondition).sort({ updatedAt: -1 }); 
      
      return res.json({
        status: true,
        publishedDate: migrationData?.updatedAt,
        data: migrationData,
      });
    } catch (ex: any) {
      return res.status(400).json({ error: ex.message });
    }
  }
}
export default new MigrationController();
