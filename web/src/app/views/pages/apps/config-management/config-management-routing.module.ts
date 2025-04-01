import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfigManagementComponent } from './config-management.component';
import {ConfigUpdateComponent} from './config-update/config-update.component';
import {ConfigHistoryComponent} from './config-history/config-history.component';
import {AppGuard, ModuleGuard} from '../../../../core/auth';
import {Services} from '../../../../constents/resources';
import {ConfigCloneComponent} from './config-clone/config-clone.component';


const routes: Routes = [
  {
    path: '',
    canActivate: [ModuleGuard],
    component: ConfigManagementComponent,
    children: [
      {
        path: '',
        redirectTo: 'config-update',
        pathMatch: 'full'
      },
      {
        path: 'config-update',
        component: ConfigUpdateComponent,
        canActivate: [AppGuard],
        data:
          {
            uniqueServiceName: Services['configManagement:config:getConfig']
          }
      },
      {
        path: 'config-history',
        component: ConfigHistoryComponent,
        canActivate: [AppGuard],
        data:
          {
            uniqueServiceName: Services['configManagement:history:getConfigHistory']
          }
      },
      {
        path: 'config-clone',
        component: ConfigCloneComponent,
        canActivate: [AppGuard],
        data:
          {
            uniqueServiceName: Services['configManagement:clone:cloneConfig']
          }
      },
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfigManagementRoutingModule { }
