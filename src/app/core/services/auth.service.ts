import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export interface AppSession {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _state$ = new BehaviorSubject<AppSession>({
    user: null,
    session: null,
    loading: true,
    profile: null,
  });
  readonly state$ = this._state$.asObservable();

  constructor(private sb: SupabaseService) {
    // Cargar sesión inicial
    this.sb.client.auth.getSession().then(({ data }) => {
      this._state$.next({
        user: data.session?.user ?? null,
        session: data.session ?? null,
        loading: false,
        profile: null,
      });
    });

    // Escuchar cambios de sesión (login/logout/refresh)
    this.sb.client.auth.onAuthStateChange((_event, session) => {
      this.refresh(session);
    });
  }

  private async refresh(session: Session | null) {
    const user = session?.user ?? null;
    let profile: any | null = null;
    if (user) {
      const { data } = await this.sb.client
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data ?? null;
    }
    this._state$.next({
      user: session?.user!,
      session,
      loading: false,
      profile,
    });
  }

  get currentUser(): User | null {
    return this._state$.value.user;
  }

  get currentProfile() {
    return this._state$.value.profile;
  }

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.sb.client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.sb.client.auth.signOut();
    if (error) throw error;
  }

  async registerUser(payload: any, useEmailPassword: boolean) {
    if (useEmailPassword) {
      // Registrar con email y contraseña usando signUp
      const { email, ...profileData } = payload;
      const { data, error } = await this.sb.client.auth.signUp({
        email: email,
        password: 'wolffitness1234',
        options: {
          data: profileData,
        },
      });
      if (error) throw error;
      return data;
    } else {
      // Insert directo en la tabla profiles
      const { data, error } = await this.sb.client
        .from('profiles')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
}
