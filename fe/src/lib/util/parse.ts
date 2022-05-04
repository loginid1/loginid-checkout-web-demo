
export default class ParseUtil {
    static displayLongAddress(address: string): string {
        let dAddress = address.substring(0, 8) + "...." + address.substring(address.length - 4);
        return dAddress;
    }
    static displayAddress(address: string): string {
        let dAddress = address.substring(0, 4) + "...." + address.substring(address.length - 4);
        return dAddress;
    }
    static displayAlgo(amount: number): string {
        return "" + amount;
    }
    static displayRecovery(publicKey: string): string {
        let dpublicKey = publicKey.substring(0, 17) + "..."
        return dpublicKey
    }
}