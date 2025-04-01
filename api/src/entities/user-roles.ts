import { Schema } from "mongoose";

import { Database } from "../lib";

import { IUserRole } from "./interfaces/iUserRole";

const PORTAL_DB = process.env.PORTAL_DB!;

const b = {
  name: "admin",
  canDelete: false,
  canEdit: false,
  permissions: [
    {
      uniqueResourceName: "codeGeneration",
      subResources: [
        {
          uniqueSubResourceName: "codeGeneration:generator",
          services: [
            {
              uniqueServiceName: "codeGeneration:generator:generateCode",
            },
          ],
        },
        {
          uniqueSubResourceName: "codeGeneration:export",
          services: [
            {
              uniqueServiceName: "codeGeneration:export:exportCodes",
            },
          ],
        },
        {
          uniqueSubResourceName: "codeGeneration:history",
          services: [
            {
              uniqueServiceName: "codeGeneration:history:getHistory",
            },
          ],
        },
      ],
    },
    {
      uniqueResourceName: "contentManagement",
      subResources: [
        {
          uniqueSubResourceName: "contentManagement:migration",
          services: [
            {
              uniqueServiceName: "contentManagement:migration:createMigration",
            },
          ],
        },
        {
          uniqueSubResourceName: "contentManagement:history",
          services: [
            {
              uniqueServiceName:
                "contentManagement:history:getAllMigrationHistory",
            },
          ],
        },
      ],
    },
    {
      uniqueResourceName: "diaperfitfinder",
      subResources: [
        {
          uniqueSubResourceName: "diaperfitfinder:transactions",
          services: [
            {
              uniqueServiceName:
                "diaperfitfinder:transactions:getAllTransactions",
            },
            {
              uniqueServiceName:
                "diaperfitfinder:transactions:exportTransactions",
            },
          ],
        },
        {
          uniqueSubResourceName: "diaperfitfinder:productVariables",
          services: [
            {
              uniqueServiceName:
                "diaperfitfinder:productVariables:getAllProductVariables",
            },
          ],
        },
        {
          uniqueSubResourceName: "diaperfitfinder:paperClassification",
          services: [
            {
              uniqueServiceName:
                "diaperfitfinder:paperClassification:getPaperClassification",
            },
          ],
        },
      ],
    },
    {
      uniqueResourceName: "downloads",
      subResources: [
        {
          uniqueSubResourceName: "downloads:exports",
          services: [
            {
              uniqueServiceName: "downloads:exports:getAllExports",
            },
          ],
        },
      ],
    },
    {
      uniqueResourceName: "fulfilment",
      subResources: [
        {
          uniqueSubResourceName: "fulfilment:history",
          services: [
            {
              uniqueServiceName: "fulfilment:history:getAllFulfilmentHistory",
            },
          ],
        },
      ],
    },
    {
      uniqueResourceName: "operations",
      subResources: [
        {
          uniqueSubResourceName: "operations:blockUnblockUsers",
          services: [
            {
              uniqueServiceName: "operations:blockUnblockUsers:searchUsers",
            },
            {
              uniqueServiceName: "operations:blockUnblockUsers:checkUserStatus",
            },
            {
              uniqueServiceName:
                "operations:blockUnblockUsers:blockOrUnblockUser",
            },
          ],
        },
        {
          uniqueSubResourceName: "operations:logs",
          services: [
            {
              uniqueServiceName: "operations:logs:searchLogs",
            },
          ],
        },
      ],
    },
    {
      uniqueResourceName: "adminPanel",
      subResources: [
        {
          uniqueSubResourceName: "adminPanel:users",
          services: [
            {
              uniqueServiceName: "adminPanel:users:getAllUsers",
            },
            {
              uniqueServiceName: "adminPanel:users:editUser",
            },
            {
              uniqueServiceName: "adminPanel:users:deleteUser",
            },
            {
              uniqueServiceName: "adminPanel:users:exportUserList",
            },
          ],
        },
        {
          uniqueSubResourceName: "adminPanel:roles",
          services: [
            {
              uniqueServiceName: "adminPanel:roles:getAllRoles",
            },
            {
              uniqueServiceName: "adminPanel:roles:editRole",
            },
            {
              uniqueServiceName: "adminPanel:roles:deleteRole",
            },
          ],
        },
      ],
    },
  ],
};

const schema = new Schema<IUserRole>(
  {
    name: {
      type: String,
      required: true,
    },
    canDelete: {
      type: Boolean,
      default: true,
    },
    canEdit: {
      type: Boolean,
      default: true,
    },
    permissions: [
      {
        uniqueResourceName: {
          type: String,
          required: true,
        },
        displayResourceName: {
          type: String,
          required: true,
        },
        subResources: [
          {
            uniqueSubResourceName: {
              type: String,
              required: true,
            },
            displaySubResourceName: {
              type: String,
              required: true,
            },
            redirectURI: {
              type: String,
            },
            services: [
              {
                uniqueServiceName: {
                  type: String,
                  required: true,
                },
                displayServiceName: {
                  type: String,
                  required: true,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    collection: "userRoles",
    timestamps: true,
  }
);

export default Database.connection
  .useDb(PORTAL_DB)
  .model<IUserRole>("UserRole", schema);
