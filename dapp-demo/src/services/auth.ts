export interface UserSession {
    username: string | null;
    token: string | null;
}
export class AuthService {
    static storeSession(user: UserSession) {
        localStorage.setItem("session", JSON.stringify(user))
    }

    static logout() {
        localStorage.removeItem("session");
    }

    static getSession(): UserSession | null {
        const userStr = localStorage.getItem("session");
        if (userStr) return JSON.parse(userStr);
        return null;
    }

    static getToken(): string | null {
        const session = this.getSession();
        if (session) return session.token;
        return null;
    }

    static getUsername(): string | null {
        const userStr = localStorage.getItem("session");
        if (userStr) return JSON.parse(userStr).username;
        return null;
    }

    static isLoggedIn(): boolean {
        if (AuthService.getSession() != null) {
            return true;
        } else {
            return false;
        }
    }
}