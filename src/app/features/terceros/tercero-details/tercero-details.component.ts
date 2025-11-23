import { Component, OnInit } from '@angular/core';
import { TercerosService } from 'src/app/core/services/terceros.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Profile,
  UserRoleId,
  DocumentTypeId,
} from 'src/app/core/interfaces/profile.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

@Component({
  selector: 'app-tercero-details',
  templateUrl: './tercero-details.component.html',
  styleUrls: ['./tercero-details.component.scss'],
})
export class TerceroDetailsComponent implements OnInit {
  tercero: Profile | null = null;
  terceroForm!: FormGroup;
  isEditMode: boolean = false;
  initialFormValue: any = null;
  loading: boolean = true;
  trainers: Profile[] = [];
  protected readonly UserRoleId = UserRoleId;
  protected readonly DocumentTypeId = DocumentTypeId;

  constructor(
    private tercerosService: TercerosService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private location: Location
  ) {
    this.initializeForm();
  }

  initializeForm() {
    this.terceroForm = this.fb.group({
      name: ['', Validators.required],
      gender: ['', Validators.required],
      birth_date: ['', Validators.required],
      document_type_id: ['', Validators.required],
      document_number: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      phone: ['', Validators.required],
      user_role_id: ['', Validators.required],
      trainer_id: [{ value: '', disabled: true }],
    });

    // Deshabilitar el formulario inicialmente
    this.terceroForm.disable();

    // Manejar cambios en el rol para habilitar/deshabilitar trainer_id
    this.terceroForm
      .get('user_role_id')
      ?.valueChanges.subscribe(async (val) => {
        if (val === UserRoleId.Cliente.toString()) {
          this.terceroForm.get('trainer_id')?.enable();
          this.terceroForm
            .get('trainer_id')
            ?.setValidators([Validators.required]);
          this.terceroForm.get('trainer_id')?.updateValueAndValidity();

          // Cargar entrenadores si no están cargados
          if (this.trainers.length === 0) {
            await this.loadEntrenadores();
          }
        } else {
          this.terceroForm.get('trainer_id')?.setValue('');
          this.terceroForm.get('trainer_id')?.disable();
          this.terceroForm.get('trainer_id')?.clearValidators();
          this.terceroForm.get('trainer_id')?.updateValueAndValidity();
        }
      });

    // Detectar cambios en el formulario
    this.terceroForm.valueChanges.subscribe(() => {
      this.checkFormChanges();
    });
  }

  async ngOnInit() {
    this.loading = true;
    try {
      this.tercero = await this.tercerosService.getTerceroById(
        this.route.snapshot.params['id']
      );

      if (this.tercero) {
        // Si es Cliente, cargar entrenadores
        if (this.tercero.user_role_id === UserRoleId.Cliente) {
          await this.loadEntrenadores();
        }

        // Formatear la fecha de nacimiento para el input date
        const birthDate = this.tercero.birth_date
          ? new Date(this.tercero.birth_date).toISOString().split('T')[0]
          : '';

        this.terceroForm.patchValue(
          {
            name: this.tercero.name || '',
            gender: this.tercero.gender || '',
            birth_date: birthDate,
            document_type_id: this.tercero.document_type_id?.toString() || '',
            document_number: this.tercero.document_number || '',
            email: this.tercero.email || '',
            address: this.tercero.address || '',
            phone: this.tercero.phone || '',
            user_role_id: this.tercero.user_role_id?.toString() || '',
            trainer_id: this.tercero.trainer_id || '',
          },
          { emitEvent: false }
        );

        // Guardar el valor inicial para comparar cambios
        this.initialFormValue = { ...this.terceroForm.getRawValue() };
      }
    } finally {
      this.loading = false;
    }
  }

  private async loadEntrenadores() {
    try {
      this.trainers = await this.tercerosService.getEntrenadores();
    } catch (error) {
      console.error('Error al cargar entrenadores:', error);
      this.trainers = [];
    }
  }

  onEdit() {
    this.isEditMode = true;
    this.terceroForm.enable();

    // Si no es Cliente, deshabilitar trainer_id
    const userRoleId = this.terceroForm.get('user_role_id')?.value;
    if (userRoleId !== UserRoleId.Cliente.toString()) {
      this.terceroForm.get('trainer_id')?.disable();
    }

    // Guardar el valor actual como referencia para detectar cambios
    this.initialFormValue = { ...this.terceroForm.getRawValue() };
  }

  onCancel() {
    this.isEditMode = false;
    this.terceroForm.disable();

    // Restaurar valores iniciales
    if (this.tercero && this.initialFormValue) {
      const birthDate = this.tercero.birth_date
        ? new Date(this.tercero.birth_date).toISOString().split('T')[0]
        : '';

      this.terceroForm.patchValue(
        {
          name: this.tercero.name || '',
          gender: this.tercero.gender || '',
          birth_date: birthDate,
          document_type_id: this.tercero.document_type_id?.toString() || '',
          document_number: this.tercero.document_number || '',
          email: this.tercero.email || '',
          address: this.tercero.address || '',
          phone: this.tercero.phone || '',
          user_role_id: this.tercero.user_role_id?.toString() || '',
          trainer_id: this.tercero.trainer_id || '',
        },
        { emitEvent: false }
      );

      this.initialFormValue = { ...this.terceroForm.getRawValue() };
    }
  }

  async onSave() {
    if (this.terceroForm.valid && this.tercero) {
      try {
        const formValue = this.terceroForm.getRawValue();
        const userRoleId = parseInt(formValue.user_role_id);
        const isCliente = userRoleId === UserRoleId.Cliente;

        // Preparar los datos para actualizar, convirtiendo strings a números donde sea necesario
        const updateData: Partial<Profile> = {
          name: formValue.name,
          gender: formValue.gender,
          birth_date: formValue.birth_date
            ? new Date(formValue.birth_date)
            : undefined,
          document_type_id: parseInt(formValue.document_type_id),
          document_number: formValue.document_number,
          email: formValue.email,
          address: formValue.address,
          phone: formValue.phone,
          user_role_id: userRoleId,
        };

        // Manejar trainer_id según el rol
        if (isCliente) {
          // Si es Cliente, trainer_id es requerido y debe tener un valor válido (no vacío)
          const trainerId = formValue.trainer_id?.trim();
          if (trainerId && trainerId !== '') {
            updateData.trainer_id = trainerId;
          } else {
            // Si no hay trainer_id válido, lanzar error
            throw new Error('El entrenador es requerido para clientes');
          }
        } else {
          // Si no es Cliente, limpiar trainer_id estableciéndolo como null
          // Esto es necesario si el usuario cambió de Cliente a otro rol
          updateData.trainer_id = null as any;
        }

        // Actualizar el tercero
        const updatedTercero = await this.tercerosService.updateTercero(
          this.tercero.id,
          updateData
        );

        // Actualizar el objeto local
        this.tercero = updatedTercero as Profile;

        // Actualizar el valor inicial para que coincida con los nuevos valores
        this.initialFormValue = { ...this.terceroForm.getRawValue() };

        // Salir del modo edición
        this.isEditMode = false;
        this.terceroForm.disable();

        // Mostrar mensaje de éxito
        this.snackBar.open('Tercero actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      } catch (error: any) {
        console.error('Error al actualizar tercero:', error);
        this.snackBar.open(
          error?.message || 'Error al actualizar el tercero',
          'Cerrar',
          {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          }
        );
      }
    }
  }

  checkFormChanges(): void {
    // Este método se llama automáticamente cuando hay cambios
    // El botón Guardar se habilita/deshabilita basado en hasFormChanges()
  }

  hasFormChanges(): boolean {
    if (!this.initialFormValue || !this.isEditMode) return false;

    const currentValue = this.terceroForm.getRawValue();
    return (
      JSON.stringify(currentValue) !== JSON.stringify(this.initialFormValue)
    );
  }

  goBack() {
    this.location.back();
  }
}
