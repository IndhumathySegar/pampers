class CommonUtil {
  /**
   * Sanitize User Role for FE
   * @param {Object} permissions user permissions
   * @returns {Object} permissions
   */
  sanitizeUserRole(permissions) {
    return permissions.map((resource) => {
      resource.isSelected = true;
      resource.subResources = resource.subResources.map((subResource) => {
        subResource.isSelected = true;
        subResource.services = subResource.services.map((service) => {
          service.isSelected = true;
          return service;
        });

        return subResource;
      });

      return resource;
    });
  }

  /**
   * Validates request paylaod for locale creation.
   * @param {Object} payload locale creation paylaod.
   * @returns {String} error | null
   */
  validateCreateLocalePayload(payload: any) {
    const {
      spaceId = "",
      environmentIds,
      code,
      language,
    }: any = payload || {};

    const codeValidatorPattern = /^[a-z]{2,3}-[A-Z]{2,3}$/;
    if (
      !Array.isArray(environmentIds) ||
      !environmentIds.length ||
      spaceId === ""
    ) {
      return `Invalid ${
        spaceId === "" ? "space id" : "environment ids"
      } passed.`;
    } else if (!code || !language) {
      return `${
        (!code && "locale code") || (!language && "language") || "country"
      } is required.`;
    } else if (!codeValidatorPattern.test(code)) {
      return "The entered locale code is invalid.";
    }

    return null;
  }
}

export default new CommonUtil();
