
    const ADDRESS_REX = new RegExp("[A-Z2-7]{58}");
export default class ValidateUtil{
    static isAlgorandAddress(address: string) : boolean {
        return ADDRESS_REX.test(address);
    }
}