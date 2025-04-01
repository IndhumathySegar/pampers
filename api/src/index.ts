import dotenv from "dotenv";
import { resolve } from "path";

console.log(process.env.NODE_ENV, "env");
// import configs for dev
if (process.env.NODE_ENV !== "PROD") {
  console.log("dirname-----", __dirname);
  console.log("path=========", `../.${process.argv[2]}.env`);
  dotenv.config({
    path: resolve(__dirname, `../.${process.argv[2]}.env`),
  });
}

import morgan from "morgan";
import chalk from "chalk";
import cors from "cors";
import express, { Express, Response } from "express";
import { json, urlencoded } from "body-parser";
import helmet from "helmet";

// @ts-ignore
import RouteRegisterer from "./components";

import { Logger } from "./lib";

// configs
const { NODE_ENV = "DEV", PORT = 8080 } = process.env;

const ApplicationContext: Express = express();
// Set the limit to an appropriate size, e.g., 10MB
ApplicationContext.use(json({ limit: "100mb" }));
ApplicationContext.use(urlencoded({ limit: "100mb", extended: true }));
ApplicationContext.disable("x-powered-by");

// Middleware Plugins
ApplicationContext.use(
  cors({
    methods: ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
  })
);
ApplicationContext.use(json());
ApplicationContext.use(helmet());
ApplicationContext.use(morgan("dev"));
// set no cache
ApplicationContext.use((_, res, next) => {
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Cache-Control", "no-store");
  next();
});

// health check
ApplicationContext.get("/api/health-check", (_, res: Response) => {
  res.send("OK");
});

RouteRegisterer(ApplicationContext);

ApplicationContext.listen(PORT, (): void => {
  Logger.info(
    `${chalk.green("✔")} [node_env: ${chalk.yellow(
      NODE_ENV
    )}] Server started on PORT ${PORT}`
  );

  // require("./cron/contentful-migration")();
  // require("./cron/new-market-translation")();
  // require("./cron/bulk-migration")();
  // require("./cron/contentful-region-mapping")();
});
