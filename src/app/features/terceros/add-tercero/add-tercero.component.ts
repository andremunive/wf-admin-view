import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Profile, UserRoleId } from 'src/app/core/interfaces/profile.interface';
import { SupabaseService } from 'src/app/core/services/supabase.service';

@Component({
  selector: 'app-add-tercero',
  templateUrl: './add-tercero.component.html',
  styleUrls: ['./add-tercero.component.scss'],
})
export class AddTerceroComponent {
  step1!: FormGroup;
  step2!: FormGroup;

  trainers: Profile[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AddTerceroComponent>,
    private supabase: SupabaseService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.createForms();
  }

  createForms() {
    this.step1 = this.fb.group({
      name: ['', Validators.required],
      gender: ['', Validators.required],
      birth_date: ['', Validators.required],
      document_type_id: ['', Validators.required],
      document_number: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });

    this.step2 = this.fb.group({
      address: ['', Validators.required],
      phone: ['', Validators.required],
      user_role_id: ['', Validators.required],
      trainer_id: [{ value: '', disabled: true }],
    });

    this.step2.get('user_role_id')?.valueChanges.subscribe(async (val) => {
      if (val === '1') {
        this.step2.get('trainer_id')?.enable();
        this.step2.get('trainer_id')?.setValidators([Validators.required]);
        this.step2.get('trainer_id')?.updateValueAndValidity();

        await this.loadClientTrainers();
      } else {
        this.step2.get('trainer_id')?.setValue('');
        this.step2.get('trainer_id')?.disable();
        this.step2.get('trainer_id')?.clearValidators();
      }
      this.step2.get('trainer_id')?.updateValueAndValidity();
    });
  }

  private async loadClientTrainers() {
    console.log('cargando entrenadores');
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('user_role_id', UserRoleId.Entrenador);
    if (error) {
      console.error('Error cargando entrenadores:', error);
      this.trainers = [];
      return;
    }

    this.trainers = data ?? [];
    console.log(this.trainers);
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if (this.step1.invalid || this.step2.invalid) {
      this.step1.markAllAsTouched();
      this.step2.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.step1.value,
      ...this.step2.value,
    };
    this.dialogRef.close(payload);
  }
}
