import { Express, Router } from "express";
import { readdirSync } from "fs";

export default async (ApplicationContext: Express): Promise<void> => {
    const routes: Router[] = [];

    for (const controller of readdirSync("./src/components")) {
        if (!controller.endsWith("Controller")) { continue; }

        const { default: router }: { default: Router } = await import(`./${controller}`);

        routes.push(router);
    }

    // register all routes
    ApplicationContext.use("/api", routes);
};
