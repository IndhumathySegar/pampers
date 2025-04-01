class RoleHelper {  
    constructor() {
        console.log("");
    }

/**
 * get permission structure
 */
 async generateStructure (input) {
        return input.permissions.map(resource => {
            return {
                displayResourceName: resource.displayResourceName,
                subResources: resource.subResources.map(subResource => {
                return {
                    displaySubResourceName: subResource.displaySubResourceName,
                    services: subResource.services.map(service => {
                    return { displayServiceName: service.displayServiceName };
                    })
                };
                })
            };
        });
    }

}

export default new RoleHelper();

