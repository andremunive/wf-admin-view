import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.state$.pipe(
      // Esperar a que se complete la carga inicial
      filter((session) => !session.loading),
      take(1),
      map((session) => {
        // Si el usuario está autenticado, redirigir al dashboard
        if (session.user && session.session) {
          this.router.navigate(['/app']);
          return false;
        }
        // Si no está autenticado, permitir el acceso al login
        return true;
      })
    );
  }
}
