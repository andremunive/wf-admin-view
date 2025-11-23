import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from './shell/shell.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { LayoutRoutingModule } from './layout-routing.module';

@NgModule({
  declarations: [ShellComponent, SidebarComponent],
  imports: [CommonModule, SharedModule, RouterModule, LayoutRoutingModule],
  exports: [ShellComponent],
})
export class LayoutModule {}
