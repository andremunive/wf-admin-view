import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TercerosComponent } from './terceros/terceros.component';
import { TerceroDetailsComponent } from './tercero-details/tercero-details.component';

const routes: Routes = [
  { path: '', component: TercerosComponent },
  { path: ':id', component: TerceroDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TercerosRoutingModule {}
