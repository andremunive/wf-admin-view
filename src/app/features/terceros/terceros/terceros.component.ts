import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DocumentTypeId,
  Profile,
  UserRoleId,
} from 'src/app/core/interfaces/profile.interface';
import { SupabaseService } from 'src/app/core/services/supabase.service';
import { AddTerceroComponent } from '../add-tercero/add-tercero.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

type PageItem = number | '...';

@Component({
  selector: 'app-terceros',
  templateUrl: './terceros.component.html',
  styleUrls: ['./terceros.component.scss'],
  animations: [
    trigger('slideDown', [
      state(
        'collapsed',
        style({
          height: '0px',
          opacity: 0,
          overflow: 'hidden',
        })
      ),
      state(
        'expanded',
        style({
          height: '*',
          opacity: 1,
        })
      ),
      transition('collapsed <=> expanded', animate('300ms ease-in-out')),
    ]),
  ],
})
export class TercerosComponent implements OnInit {
  profiles: Profile[] = [];
  error?: string;
  loading = false;

  pageSizeOptions = [10, 25, 50];
  pageSize = 10; // por defecto
  currentPage = 1;
  totalProfiles = 0;
  totalPages = 0;
  pageItems: PageItem[] = []; // para dibujar 01 02 03 ... 10 11
  protected readonly DocumentTypeId = DocumentTypeId;
  protected readonly UserRoleId = UserRoleId;

  // Filtros
  filtersExpanded = false;
  selectedRoleId: number | null = null;
  roleOptions = [
    { value: UserRoleId.Cliente, label: 'Cliente' },
    { value: UserRoleId.Entrenador, label: 'Entrenador' },
    { value: UserRoleId.Administrador, label: 'Administrador' },
    { value: UserRoleId.Proveedor, label: 'Proveedor' },
  ];

  private isUpdatingUrl = false; // Flag para evitar cargas duplicadas

  constructor(
    private _supaBase: SupabaseService,
    private dialog: MatDialog,
    private _authService: AuthService,
    private _snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    // Leer query params de la URL al iniciar
    const params = this.route.snapshot.queryParams;
    const roleParam = params['role'];
    if (roleParam) {
      this.selectedRoleId = Number(roleParam);
      this.filtersExpanded = true;
    } else {
      this.selectedRoleId = null;
      this.filtersExpanded = false;
    }

    const page = params['page'] ? Number(params['page']) : 1;
    const pageSize = params['pageSize']
      ? Number(params['pageSize'])
      : this.pageSize;
    this.pageSize = pageSize;

    await this.loadProfiles(page, pageSize, this.selectedRoleId);

    // Suscribirse a cambios en los query params (por ejemplo, cuando se navega de vuelta)
    this.route.queryParams.subscribe(async (queryParams) => {
      // Evitar procesar si estamos actualizando la URL nosotros mismos
      if (this.isUpdatingUrl) {
        this.isUpdatingUrl = false;
        return;
      }

      const newRoleParam = queryParams['role'];
      const newSelectedRoleId = newRoleParam ? Number(newRoleParam) : null;

      const newPage = queryParams['page'] ? Number(queryParams['page']) : 1;
      const newPageSize = queryParams['pageSize']
        ? Number(queryParams['pageSize'])
        : this.pageSize;

      // Solo actualizar si hay cambios reales
      if (
        newPage !== this.currentPage ||
        newPageSize !== this.pageSize ||
        newSelectedRoleId !== this.selectedRoleId
      ) {
        this.selectedRoleId = newSelectedRoleId;
        this.filtersExpanded = this.selectedRoleId !== null;
        this.pageSize = newPageSize;
        await this.loadProfiles(newPage, newPageSize, this.selectedRoleId);
      }
    });
  }

  async loadProfiles(
    page: number = 1,
    pageSize: number = this.pageSize,
    roleId: number | null = null
  ) {
    this.loading = true;
    this.currentPage = page;
    this.pageSize = pageSize;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this._supaBase.client
      .from('profiles')
      .select('*', { count: 'exact' });

    // Aplicar filtro por role si existe
    if (roleId !== null && roleId !== undefined) {
      query = query.eq('user_role_id', roleId);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error(error);
      this.error = error.message;
      this.profiles = [];
      this.totalProfiles = 0;
      this.totalPages = 0;
      this.pageItems = [];
      this.loading = false;
      return;
    }

    this.error = undefined;
    this.profiles = (data ?? []) as Profile[];

    this.totalProfiles = count ?? 0;
    this.totalPages = Math.max(
      1,
      Math.ceil(this.totalProfiles / this.pageSize)
    );
    this.pageItems = this.buildPageItems();
    this.loading = false;
  }

  private buildPageItems(): PageItem[] {
    const pages: PageItem[] = [];

    if (this.totalPages <= 7) {
      for (let p = 1; p <= this.totalPages; p++) {
        pages.push(p);
      }
      return pages;
    }

    const current = this.currentPage;
    const last = this.totalPages;

    if (current <= 4) {
      // 1 2 3 4 5 ... last
      for (let p = 1; p <= 5; p++) pages.push(p);
      pages.push('...');
      pages.push(last);
      return pages;
    }

    if (current >= last - 3) {
      // 1 ... last-4 last-3 last-2 last-1 last
      pages.push(1);
      pages.push('...');
      for (let p = last - 4; p <= last; p++) pages.push(p);
      return pages;
    }

    // 1 ... current-1 current current+1 ... last
    pages.push(1);
    pages.push('...');
    pages.push(current - 1, current, current + 1);
    pages.push('...');
    pages.push(last);
    return pages;
  }

  async goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    await this.updateUrlParams(page, this.pageSize, this.selectedRoleId);
    await this.loadProfiles(page, this.pageSize, this.selectedRoleId);
  }

  async goPrevious() {
    if (this.currentPage > 1) {
      const newPage = this.currentPage - 1;
      await this.updateUrlParams(newPage, this.pageSize, this.selectedRoleId);
      await this.loadProfiles(newPage, this.pageSize, this.selectedRoleId);
    }
  }

  async goNext() {
    if (this.currentPage < this.totalPages) {
      const newPage = this.currentPage + 1;
      await this.updateUrlParams(newPage, this.pageSize, this.selectedRoleId);
      await this.loadProfiles(newPage, this.pageSize, this.selectedRoleId);
    }
  }

  async onPageSizeChange(event: Event) {
    const value = Number((event.target as HTMLSelectElement).value);
    if (!value) return;

    await this.updateUrlParams(1, value, this.selectedRoleId);
    await this.loadProfiles(1, value, this.selectedRoleId);
  }

  toggleFilters() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  getActiveRoleLabel(): string | null {
    if (this.selectedRoleId === null) {
      return null;
    }
    const role = this.roleOptions.find((r) => r.value === this.selectedRoleId);
    return role ? role.label : null;
  }

  async removeFilter() {
    this.selectedRoleId = null;
    this.filtersExpanded = false;
    // Actualizar URL eliminando el filtro y resetear a página 1
    await this.updateUrlParams(1, this.pageSize, null);
    // Cargar los perfiles sin filtro
    await this.loadProfiles(1, this.pageSize, null);
  }

  async applyFilters(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    // Actualizar URL con los filtros y resetear a página 1
    await this.updateUrlParams(1, this.pageSize, this.selectedRoleId);
    // Cargar los perfiles directamente después de actualizar la URL
    await this.loadProfiles(1, this.pageSize, this.selectedRoleId);
  }

  private async updateUrlParams(
    page: number,
    pageSize: number,
    roleId: number | null
  ) {
    this.isUpdatingUrl = true; // Marcar que estamos actualizando nosotros

    const queryParams: any = {};

    // Construir query params - solo incluir los que no son valores por defecto
    // Esto permite que la URL se limpie cuando se restablecen valores por defecto
    if (page > 1) {
      queryParams['page'] = page;
    }
    if (pageSize !== 10) {
      queryParams['pageSize'] = pageSize;
    }
    if (roleId !== null && roleId !== undefined) {
      queryParams['role'] = roleId;
    }
    // Si roleId es null, no lo incluimos en queryParams, lo que lo eliminará de la URL

    // Usar replaceUrl para no agregar una entrada en el historial cuando solo cambian filtros/paginación
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true,
    });

    // Resetear el flag después de que la navegación se complete
    setTimeout(() => {
      this.isUpdatingUrl = false;
    }, 100);
  }

  addTerceros() {
    const dialogRef = this.dialog.open(AddTerceroComponent, {
      disableClose: true,
      width: '650px',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        console.log('Nuevo tercero:', result);
        const needEmailPassword =
          result.user_role_id === UserRoleId.Administrador ||
          result.user_role_id === UserRoleId.Entrenador;

        try {
          await this._authService.registerUser(result, needEmailPassword);

          // Mostrar toast de éxito
          this._snackBar.open('Registro exitoso', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });

          // Esperar un poco para que el registro se propague en la base de datos
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Recargar los perfiles
          await this.updateUrlParams(1, this.pageSize, this.selectedRoleId);
          await this.loadProfiles(1, this.pageSize, this.selectedRoleId);
        } catch (error) {
          console.error('Error al registrar tercero:', error);
          this._snackBar.open('Error al registrar el tercero', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        }
      }
    });
  }

  getSkeletonArray(): number[] {
    return Array(this.pageSize).fill(0);
  }

  openProfile(profile: Profile) {
    console.log('Perfil:', profile);
    this.router.navigate([`app/terceros/${profile.id}`]);
  }
}
