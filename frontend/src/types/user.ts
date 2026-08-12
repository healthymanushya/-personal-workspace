export interface User {
  id: string;
  email: string;
  full_name: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}
