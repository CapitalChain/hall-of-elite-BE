import { RegisterInput, LoginInput } from "./auth.validator";
import { AuthResponseDTO, UserPayload } from "./auth.dto";
export declare class AuthService {
    private readonly SALT_ROUNDS;
    /** Registration disabled – use Capital Chain login and POST /auth/store-token. */
    register(_data: RegisterInput): Promise<AuthResponseDTO>;
    /** Local login disabled – use Capital Chain login and POST /auth/store-token. */
    login(_data: LoginInput): Promise<AuthResponseDTO>;
    logout(): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyToken(token: string): UserPayload;
    /** No longer used – getMe uses req.user payload only (User table dropped). */
    getUserById(_userId: string): Promise<{
        id: string;
        email: string;
        displayName: string;
        role: string;
    } | null>;
    private generateToken;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map