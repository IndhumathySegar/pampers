import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '@env/environment';
import {cloneDeep} from 'lodash';


const {API_URL: baseUrl} = environment;

@Injectable({
  providedIn: 'root'
})
export class ConfigManagementService {
  private id = '';
  private locale = '';
  private env = '';
  private fromCloneLocale = '';
  private fromCloneEnv = '';
  private categories = [];
  private cloneSelectedKeys = {};
  private tempConfigMap = {};
  private modifiedConfigMap = {};
  private backupConfigMap = {};
  private deletedChanges = {};
  private addedChanges = {};
  private existingChanges = {};

  // History
  private history = [];
  private allComponentData = {};
  private backupCommonData = {};

  constructor(private readonly http: HttpClient) {
  }

  cloneDataToModifiedConfig(data) {
    Object.keys(data)
      .reverse()
      .forEach((category) => {
        for (const ele of data[category]) {
          this.modifiedConfigMap[ele.configKey] = ele.configValue;
          this.backupConfigMap[ele.configKey] = ele.configValue;
        }
      });
  }

  cloneModifiedToTemp(config) {
    this.tempConfigMap = {};
    this.tempConfigMap = cloneDeep(config);
  }

  getModifiedConfig() {
    return this.modifiedConfigMap;
  }

  getBackupConfig() {
    return this.backupConfigMap;
  }

  getTempConfig() {
    return this.tempConfigMap;
  }

  addConfig(config) {
    this.modifiedConfigMap[config.configKey] = config.configValue;
    this.addedChanges[config.configKey] = config.configValue;
  }

  getFromCloneLocale() {
    return this.fromCloneLocale;
  }

  getFromCloneEnv() {
    return this.fromCloneEnv;
  }

  saveID(id) {
    this.id = id;
  }

  saveLocale(locale) {
    this.locale = locale;
  }

  saveCategories(categories) {
    this.categories = categories;
  }

  saveFromCloneLocale(locale) {
    this.fromCloneLocale = locale;
  }

  saveEnv(env) {
    this.env = env;
  }

  saveFromCloneEnv(env) {
    this.fromCloneEnv = env;
  }

  saveHistory(history) {
    this.history = history;
  }

  saveComponentData(config, id) {
    this.allComponentData[id] = config;
  }

  saveBackupComponentData(config) {
    for (const ele of config) {
      this.backupCommonData[ele.configKey] = ele.configValue;
    }
  }

  saveSelectedConfigToClone(tableId, val) {
    this.cloneSelectedKeys[tableId] = val;
  }

  getSelectedConfigToClone() {
    Object.keys(this.cloneSelectedKeys)
      .forEach((key) => {
        if (this.cloneSelectedKeys[key].length === 0) {
          delete this.cloneSelectedKeys[key];
        }
      });
    return this.cloneSelectedKeys;
  }

  getAllComponentData() {
    return this.allComponentData;
  }

  getBackupCommonData() {
    return this.backupCommonData;
  }

  replaceConfig(prior, current) {
    this.modifiedConfigMap[current.configKey] = current.configValue;
    delete this.modifiedConfigMap[prior.configKey];
    this.existingChanges[current.configKey] = current.configValue;
    delete this.existingChanges[prior.configKey];
  }

  addToExistingConfig(current) {
    this.modifiedConfigMap[current.configKey] = current.configValue;
    this.existingChanges[current.configKey] = current.configValue;
  }

  removeConfig(config) {
    delete this.modifiedConfigMap[config.configKey];
    if (JSON.stringify(this.modifiedConfigMap) !== JSON.stringify(this.backupConfigMap)) {
      this.deletedChanges[config.configKey] = config.configValue;
    } else {
      this.deletedChanges = {};
    }

    // check if key exists in other too
    if (this.addedChanges.hasOwnProperty(config.configKey)) {
      delete this.addedChanges[config.configKey];
    }
    if (this.existingChanges.hasOwnProperty(config.configKey)) {
      delete this.existingChanges[config.configKey];
    }
  }

  removeFromAdded(configKey) {
    delete this.addedChanges[configKey];
  }

  clearConfigs(config) {
    this.modifiedConfigMap = cloneDeep(config);
    this.backupConfigMap = cloneDeep(config);
    this.addedChanges = {};
    this.deletedChanges = {};
    this.existingChanges = {};
  }

  clearSelectedConfigToClone() {
    this.cloneSelectedKeys = {};
  }

  clearHistory() {
    this.history = [];
  }

  getDeletedChanges() {
    return this.deletedChanges;
  }

  getExistingChanges() {
    return this.existingChanges;
  }

  getAddedChanges() {
    return this.addedChanges;
  }

  getID() {
    return this.id;
  }

  getLocale() {
    return this.locale;
  }

  getEnv() {
    return this.env;
  }

  getCategories() {
    return this.categories;
  }

  getHistoryById(id: number) {
    return this.history[id];
  }

  updateConfig(prior, modified, common, deletedCommon, localeEnv, id, categories) {
    const URL = `${baseUrl}/api/config-manage/config`;
    return this.http.post(URL, {
      prior, modified, common, deletedCommon, locale: localeEnv.locale, env: localeEnv.env, id, categories
    });
  }

  rollbackConfig(rollback) {
    const URL = `${baseUrl}/api/config-manage/rollback`;
    return this.http.post(URL, {rollback});
  }

  getConfig(query) {
    const URL = `${baseUrl}/api/config-manage/config`;
    return this.http.get(URL, {params: query});
  }

  getConfigHistoryFromApi(query) {
    const URL = `${baseUrl}/api/config-manage/history`;
    return this.http.get(URL, {params: query});
  }

  cloneConfig(from, to, keys, configs) {
    const URL = `${baseUrl}/api/config-manage/clone`;
    return this.http.post(URL, {from, to, keys, configs});
  }

  getPortalSettings() {
    const URL = `${baseUrl}/api/portal-settings`;
    return this.http.get(URL);
  }
}
