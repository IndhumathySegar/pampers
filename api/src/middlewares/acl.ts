import type { LeanDocument } from "mongoose";

import { Request, Response, NextFunction } from "express";

import { UserRoleModel } from "../entities";
import { Logger } from "../lib";
import { IUserRole } from "../entities/interfaces/iUserRole";

const hasPermission = (uniqueServiceName: string = "defaults") => {
    return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
        const { user: { role }, method, path } = req;    
      
        const message: string = `${role} does not have permission to access ${method} of ${path}`;

        try {
            const permission: LeanDocument<IUserRole> | null = await UserRoleModel.findOne({
                name: role,
                permissions: {
                    $elemMatch: {
                        subResources: {
                            $elemMatch: {
                                services: {
                                    $elemMatch: {
                                        uniqueServiceName
                                    }
                                }
                            }
                        }
                    }
                }
            }, { _id: 1 }).lean().exec();

            if (!permission) {
                // does not have the permission
                return res.status(403).json({ message });
            }

            // has the permission
            return next();
        } catch (ex: any) {
            Logger.error(ex);
            return res.status(500).json({ error: ex.message });
        }
    };
};

export default {
    hasPermission
};
