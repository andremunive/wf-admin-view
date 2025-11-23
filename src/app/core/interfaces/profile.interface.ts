export interface Profile {
  id: string;
  address: string;
  birth_date: Date;
  document_number: string;
  document_type_id: DocumentTypeId;
  gender: string;
  name: string;
  user_id: string;
  phone: string;
  trainer_id: string;
  user_role_id: UserRoleId;
  email: string;
}

export enum DocumentTypeId {
  CC = 1,
  NIT = 2,
}

export enum UserRoleId {
  Cliente = 1,
  Entrenador = 2,
  Administrador = 3,
  Proveedor = 4,
}
