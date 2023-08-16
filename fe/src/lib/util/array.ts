
export class ArrayUtil {

    static contains(myArray: string[], value: string ) : boolean {
        return myArray.includes(value);
    }
    static arrayToString(array: string []) : string {
        let value ="";
        array.join(",");
        return value;
    }
}