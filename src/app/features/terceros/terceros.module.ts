import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TercerosRoutingModule } from './terceros-routing.module';
import { TercerosComponent } from './terceros/terceros.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddTerceroComponent } from './add-tercero/add-tercero.component';
import { TerceroDetailsComponent } from './tercero-details/tercero-details.component';

@NgModule({
  declarations: [
    TercerosComponent,
    AddTerceroComponent,
    TerceroDetailsComponent,
  ],
  imports: [
    CommonModule,
    TercerosRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class TercerosModule {}
