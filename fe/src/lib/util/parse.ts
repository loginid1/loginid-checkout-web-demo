import Big from 'big.js';
const dateTimeFormat = new Intl.DateTimeFormat("en", {
    month: "numeric",
    year: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
});

const dateFormat = new Intl.DateTimeFormat("en", {
    month: "numeric",
    year: "numeric",
    day: "numeric",
});

const MICRO_UNIT = new Big(1000000);

export default class ParseUtil {

    static displaySessionSF(session: string): string {
        return session.substring(0, 6) ;
    }
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
    static parseDateTime(time: string): string {
        return dateTimeFormat.format(Date.parse(time));
    }

    static parseDateTimeUnix(time: number): string {
        return dateTimeFormat.format(new Date(time * 1000));
    }

    static parseDate(time: string): string {
        return dateFormat.format(Date.parse(time));
    }

    static parseDateUnix(time: number): string {
        return dateFormat.format(new Date(time * 1000));
    }

    static parseDate_(time: Date): string {
        return dateFormat.format(time);
    }

    static convertAlgo(micro: number): string {
        let value = new Big(micro);
        value = value.div(MICRO_UNIT); 
        return value.toString();
    }

    static parseSendWyreAddress(address: string): string {
        return address.replace(/algorand:/g,"");
    }

    static parseWhitespaceQuery(value: string): string {
        return decodeURI(decodeURI(value));
        //return value.replace(/qwer/g," ");
    }
    // remove ALGO_ prefix
    static removeNetworkPrefix(value: string) : string {
        return value.replace(/ALGO_/g,"");
    }
}