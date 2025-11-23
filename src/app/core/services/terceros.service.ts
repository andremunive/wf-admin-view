import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile, UserRoleId } from '../interfaces/profile.interface';

@Injectable({ providedIn: 'root' })
export class TercerosService {
  constructor(private supabase: SupabaseService) {}

  async getTerceroById(id: string) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async updateTercero(id: string, updates: Partial<Profile>) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getEntrenadores(): Promise<Profile[]> {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('user_role_id', UserRoleId.Entrenador);
    if (error) throw error;
    return (data ?? []) as Profile[];
  }
}
