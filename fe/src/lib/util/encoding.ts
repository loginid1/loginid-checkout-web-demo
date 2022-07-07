export default class EncodingUtil {
    static encodeString(aSrc: string) : string {
        let b64 = btoa(aSrc);
        return this.base64EncodeUrl(b64);
    }

    static base64EncodeUrl (str: string) : string {
        return str
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }
    static decodeString(aSrc:string) :string {
        return atob(aSrc.replace(/-/g, '+')
            .replace(/_/g, '/'));
    }
}