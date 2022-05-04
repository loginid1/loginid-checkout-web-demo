
  const dateTimeFormat = new Intl.DateTimeFormat("en", {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  });
export default class ParseUtil {
    static displayLongAddress (address: string) : string {
        let dAddress = address.substring(0,8) + "...." + address.substring(address.length -4);
        return dAddress;
    }
    static displayAddress (address: string) : string {
        let dAddress = address.substring(0,4) + "...." + address.substring(address.length -4);
        return dAddress;
    }
    static displayAlgo(amount: number) : string {
        return "" + amount;
    }
    static parseDate(time: string) : string {
        return dateTimeFormat.format(Date.parse(time));
    }


}