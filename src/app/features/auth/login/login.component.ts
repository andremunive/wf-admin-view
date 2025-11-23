import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  hide = true;

  isSubmitting = false;

  form = this.fb.group({
    email: ['test@example.com', [Validators.required, Validators.email]],
    password: ['12345', [Validators.required, Validators.minLength(5)]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  get email() {
    return this.form.get('email');
  }
  get password() {
    return this.form.get('password');
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    const { email, password } = this.form.value;

    try {
      await this.auth.signInWithPassword(String(email), String(password));
      this.router.navigateByUrl('/app');
    } catch (err: any) {
      // Mensaje de Supabase o genérico
      this.snack.open(err?.message ?? 'Error al iniciar sesión', 'Cerrar', {
        duration: 4000,
      });
    } finally {
      this.isSubmitting = false;
      console.log(this.auth.currentProfile);
    }
  }

  showUser() {
    // console.log('USER: ', this.auth.currentProfile);
  }

  togglePassword(): void {
    this.hide = !this.hide;
  }
}
