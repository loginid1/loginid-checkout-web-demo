const ADDRESS_REX = new RegExp("[A-Z2-7]{58}");
const EMAIL_REX = new RegExp(`^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$`);
export default class ValidateUtil {
	static isAlgorandAddress(address: string): boolean {
		return ADDRESS_REX.test(address);
	}
    static isEmailAddress(address: string): boolean {
        return EMAIL_REX.test(address);
    }
}
