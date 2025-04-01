import * as contentful from "contentful-management";
import { runMigration } from "contentful-migration";
import { get, isEqual } from "lodash";
import { Types } from "mongoose";
import ContentfulMigrationModel from "../entities/contentful-migration";

const CONTENTFUL_MANAGEMENT_TOKEN = get(
  process.env,
  "CONTENTFUL_MANAGEMENT_TOKEN"
)!;
const client = contentful.createClient({
  accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
});

class ContentModelUtil {
  /**
   * migrate contentTypes
   * @param {any} task migrate data
   */
  async ccontentTypeMigrate(task: any): Promise<void> {
    const { spaceId, source, destination, contentTypeId } = task;
    const space = await client.getSpace(spaceId);
    const [sourceEnvironment, destinationEnvironment] = await Promise.all([
      space.getEnvironment(source),
      space.getEnvironment(destination),
    ]);
    const [sourceContentType, destinationContentType] = await Promise.all([
      sourceEnvironment.getContentType(contentTypeId),
      destinationEnvironment.getContentType(contentTypeId),
    ]);
    let contentTypeChanged = false;

    if (!isEqual(sourceContentType.fields, destinationContentType.fields)) {
      contentTypeChanged = true;
    }
    if (contentTypeChanged) {
      const migrationFunction = (migration) => {
        const contentType = migration.editContentType(contentTypeId);

        sourceContentType.fields.forEach(async (sourceField) => {
          const destinationField = destinationContentType.fields.find(
            (field) => field.id === sourceField.id
          );

          if (!destinationField) {
            await this.createField(contentType, sourceField);
          } else {
            await this.updateField(contentType, sourceField, destinationField);
          }
        });
        destinationContentType.fields.forEach((destinationField) => {
          if (
            !sourceContentType.fields.find(
              (field) => field.id === destinationField.id
            )
          ) {
            contentType.deleteField(destinationField.id);
          }
        });
      };
      runMigration({
        spaceId,
        environmentId: destination,
        accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
        yes: true,
        retryLimit: 50,
        migrationFunction,
      })
        .then(() =>
          console.log(`Migration for content type ${contentTypeId} done!`)
        )
        .catch((e) => console.error(e));
    } else {
      console.log(`No changes detected for content type ${contentTypeId}`);
    }
  }

  /**
   * create new fields
   * @param {any} contentType content type
   *  @param {any} SourceField field to create
   */
  async createField(contentType: any, SourceField: any): Promise<void> {
    const newField = contentType.createField(SourceField.id);
    if (SourceField.name) {
      newField.name(SourceField.name);
    }
    if (SourceField.type) {
      newField.type(SourceField.type);
    }
    if (SourceField.description) {
      newField.description(SourceField.description);
    }
    if (SourceField.localized) {
      newField.localized(SourceField.localized);
    }
    if (SourceField.required) {
      newField.required(SourceField.required);
    }
    if (SourceField.disabled) {
      newField.disabled(SourceField.disabled);
    }
    if (SourceField.omitted) {
      newField.omitted(SourceField.omitted);
    }
    if (SourceField.validations) {
      newField.validations(SourceField.validations);
    }
    if (SourceField.deleted) {
      newField.deleted(SourceField.deleted);
    }
    if (SourceField.defaultValue) {
      newField.defaultValue(SourceField.defaultValue);
    }
    if (SourceField.allowedResources) {
      newField.allowedResources(SourceField.allowedResources);
    }
    if (SourceField.items) {
      newField.items(SourceField.items);
    }
    if (SourceField.linkType) {
      newField.linkType(SourceField.linkType);
    }
  }

  /**
   * update existing fields
   * @param {any} contentType content type
   * @param {any} sourceField source field
   * @param {any} destinationField destination field
   */
  async updateField(
    contentType: any,
    sourceField: any,
    destinationField: any
  ): Promise<void> {
    const { type } = destinationField;

    if (type !== sourceField.type) {
      console.log("deleting first");
      contentType.deleteField(destinationField.id);
      console.log("then creating");
      await this.createField(contentType, sourceField);
    } else {
      const field = contentType.editField(sourceField.id);

      await this.updateFieldProperties(field, sourceField, destinationField);
    }
  }

  /**
   * get content
   * @param {any} field update field
   * @param {any} sourceField source field
   * @param {any} destinationField destination field
   */
  async updateFieldProperties(
    field: any,
    sourceField: any,
    destinationField: any
  ): Promise<void> {
    const { name, type, localized, required, validations, disabled, omitted } =
      destinationField;
    if (sourceField.name && name !== sourceField.name) {
      field.name(sourceField.name);
    }
    if (sourceField.type && type !== sourceField.type) {
      field.type(sourceField.type);
    }
    if (sourceField.localized && localized !== sourceField.localized) {
      field.localized(sourceField.localized);
    }
    if (sourceField.required && required !== sourceField.required) {
      field.required(sourceField.required);
    }
    if (
      sourceField.validations &&
      !isEqual(validations, sourceField.validations)
    ) {
      field.validations(sourceField.validations);
    }
    if (sourceField.disabled && disabled !== sourceField.disabled) {
      field.disabled(sourceField.disabled);
    }
    if (sourceField.omitted && omitted !== sourceField.omitted) {
      field.omitted(sourceField.omitted);
    }
    await this.updateOptionalFieldProperties(field, sourceField);
  }

  /**
   * get content
   * @param {any} field update field
   * @param {any} sourceField source field
   */
  async updateOptionalFieldProperties(
    field: any,
    sourceField: any
  ): Promise<void> {
    const updateMethods = [
      {
        condition: sourceField.description,
        method: () => field.description(sourceField.description),
      },
      {
        condition: sourceField.deleted,
        method: () => field.deleted(sourceField.deleted),
      },
      {
        condition: sourceField.defaultValue,
        method: () => field.defaultValue(sourceField.defaultValue),
      },
      {
        condition: sourceField.allowedResources,
        method: () => field.allowedResources(sourceField.allowedResources),
      },
      {
        condition: sourceField.items,
        method: () => field.items(sourceField.items),
      },
      {
        condition: sourceField.linkType,
        method: () => field.linkType(sourceField.linkType),
      },
    ];
    for (const { condition, method } of updateMethods) {
      if (condition) {
        method();
      }
    }
  }

  /**
   * get content types
   * @param {any} task space and source data
   * @returns {Promise<string>} return content type id
   */
  async getAllContentTypes(task: any): Promise<string[]> {
    const { spaceId, source } = task;
    const space = await client.getSpace(spaceId);
    const sourceEnvironment = await space.getEnvironment(source);
    const contentTypes = await sourceEnvironment.getContentTypes();
    return contentTypes.items.map((contentType) => contentType.sys.id);
  }

  /**
   * chunck array
   * @param {any} array
   * @param {any} chunkSize
   * @returns {Promise<string>}
   */
  async chunkArray(array: any, chunkSize: any): Promise<any[]> {
    const chunks: any[] = [];
    let i = 0;
    while (i < array.length) {
      chunks.push(array.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return chunks;
  }

  /**
   * sync content type
   * @param {any} task data
   */
  async contentTypeSync(task: any): Promise<void> {
    try {
      const { spaceId, source, destination } = task;
      const contentTypeIds = await this.getAllContentTypes(task);
      const concurrencyLimit = 2;
      const chunks = await this.chunkArray(contentTypeIds, concurrencyLimit);

      for (const chunk of chunks) {
        const promises = chunk.map(async (contentTypeId: any) =>
          this.ccontentTypeMigrate({
            contentTypeId,
            spaceId,
            source,
            destination,
          })
        );
        await Promise.all(promises);
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * error handling
   * @param {any} dataArray errorLog
   * @param {any} _id mongo entry Id
   */
  async errorDetails(dataArray: any[], _id: any, errorKey? ): Promise<void> {
    const uniqueErrors: any[] = Object.values(
      dataArray.reduce((acc, curr) => {
        if (curr.error && curr.error.name && !acc[curr.error.name]) {
          acc[curr.error.name] = curr.error;
        }
        return acc;
      }, {})
    );
    if (uniqueErrors.length === 0) {
      return;
    }

    const errorData = errorKey ==="rollBackError" ? "rollBackError" : "errorDetails";

    try {
      await this.updateError({uniqueErrors, errorData, dataArray, _id});
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * update Error
   * @param {any} dataArray errorLog
   * @param {any} _id mongo entry Id
   */

  async updateError({uniqueErrors, errorData, dataArray, _id}) {
    for (const uniqueError of uniqueErrors) {
      const update: any = {
        $push: {
          [errorData]: {
            error: uniqueError.name,
            message: uniqueError.data?.message,
          },
        },
      };
      if (uniqueError.name === "UnresolvedLinks") {
        update.$push[errorData].details =
          dataArray[dataArray.length - 1].error;
      } else if (uniqueError.name === "AssetProcessingTimeout") {
        update.$push[errorData].details = `AssetProcessingTimeout occured with id: ${JSON.stringify(
          uniqueError.entity?.sys?.id
        )}`;
      } else if (uniqueError.name === "VersionMismatch") {
        update.$push[errorData].details =
          "Two jobs ran parallelly!! Your migration would be completed if there were no other errors.";
        update.$push[errorData].message = uniqueError.data?.statusText;
      } else if (uniqueError.name === "BadRequest") {
        const badRequestEntities = dataArray.filter(
          (item) => item.error?.name === "BadRequest"
        );
        const badRequestIds = badRequestEntities
          .map((item) => item.error.entity?.sys?.id)
          .filter(Boolean);
        if (badRequestIds.length > 0) {
          update.$push[errorData].details = `There is a mismatch in contentType with id: ${JSON.stringify(
            badRequestIds
          )}`;
        } else {
          update.$push[errorData].message = uniqueError.data?.message;
        }
      }
      await ContentfulMigrationModel.updateOne(
        { _id: Types.ObjectId(_id) },
        update
      ).exec();
    }
  }
}
export default new ContentModelUtil();
