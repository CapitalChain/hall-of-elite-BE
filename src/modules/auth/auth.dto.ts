export interface RegisterDTO {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthResponseDTO {
  success: boolean;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: string;
  };
  token: string;
}

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}
