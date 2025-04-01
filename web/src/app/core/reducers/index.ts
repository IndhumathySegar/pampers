// NGRX
import { routerReducer } from '@ngrx/router-store';
import { ActionReducerMap, ActionReducer, MetaReducer } from '@ngrx/store';
import { storeLogger, LoggerOptions } from 'ngrx-store-logger';
import { storeFreeze } from 'ngrx-store-freeze';

import { environment } from '../../../environments/environment';

const loggerOptions: LoggerOptions = {
    collapsed: true
}

// tslint:disable-next-line:no-empty-interface
export interface AppState { }

export function logger(reducer: ActionReducer<AppState>): any {
    return storeLogger(loggerOptions)(reducer);
}

export const reducers: ActionReducerMap<AppState> = { router: routerReducer };

const middlewares = [];
if (environment.STORE_LOGGER) {
    middlewares.push(logger)
}

export const metaReducers: Array<MetaReducer<AppState>> = environment.production ? middlewares : [logger, storeFreeze];
