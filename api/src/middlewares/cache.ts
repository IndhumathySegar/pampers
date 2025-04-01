import {NextFunction, Request, Response} from "express";
import { getAsync } from "../utils/redisClient";

class CacheMiddleware {
  /**
   * Get data using cacheMiddleware
   * @param {Request} req Request Object
   * @param {Response} res Response Object
   * @param {NextFunction} next Next Function
   * @return {Promise<void>} Response
   */
  getCachedData = async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = req.originalUrl;
    try {
      const cacheResults = await getAsync(cacheKey);
      console.log("Value while getting the key:", cacheResults);
      if (cacheResults) {
        return res.json(JSON.parse(cacheResults));
      } else {
        console.log("no Redis cache data found!, move to the next middleware");
        // If data not found in cache, move to the next middleware/route handler
        next();
      }
    } catch (err) {
      console.error("Error checking Redis cache:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

export default new CacheMiddleware();
