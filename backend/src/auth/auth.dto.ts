export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  barangay: string;
}

export interface LoginDto {
  email: string;
  password: string;
}
