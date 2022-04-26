
import { WINDOW_NOT_OPENED } from "./errors";

/**
 * @description Popup configuration
 * @typedef {Object} PopupOptions
 * @property {string} [name]
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [top]
 * @property {number} [left]
 * @property {0|1} [status]
 * @property {0|1} [resizable]
 * @property {0|1} [toolbar]
 * @property {0|1} [menubar]
 * @property {0|1} [scrollbars]
 */

export interface PopupOptions  {
    width: number;
    height: number;
    left: number;
    top: number;
    status: number,
    toolbar: number,
    menubar: number,
    resizable: number,
    scrollbars: number,
}

/**
 * @type {PopupOptions}
 */
export const defaultOptions = <PopupOptions> {
	width: 400,
	height: 600,
    left: 0,
    top: 0,
			status: 1,
			toolbar: 0,
			menubar: 0,
			resizable: 1,
			scrollbars: 1,
};

/**
 * @description Open a new browser window
 * @param {string} url
 * @param {PopupOptions} options
 * @returns {Window}
 * @file Open new popup
 * @author The kraken.js team
 * @copyright This file is part of the project BelterJS which is released under Apache-2.0 License.
 * Go to https://github.com/krakenjs/belter for full license details.
 */

export function openPopup(url : string, options : PopupOptions = defaultOptions ) : Window {

	//let options = { name : ""; width: 0; height:0; top : 0; left : 0 } ;
    let name = "";
    let left = 0;
    let top = 0;
    let width = options.width;
    let height = options.height;

	if (width) {
		if (window.outerWidth) {
			left = Math.round((window.outerWidth - width) / 2) + window.screenX;
		}
		else if (window.screen.width) {
			left = Math.round((window.screen.width - width) / 2);
		}
	}

	if (height) {
		if (window.outerHeight) {
			top = Math.round((window.outerHeight - height) / 2) + window.screenY;
		}
		else if (window.screen.height) {
			top = Math.round((window.screen.height - height) / 2);
		}
	}
    options.left = left;
    options.top = top;


	// eslint-disable-next-line array-callback-return

    const params = Object.entries(options).map(([key, value]) => {
        if (value !== null && value !== undefined && typeof value.toString === 'function') {
			return `${key}=${value.toString()}`;
		}
    }).filter(Boolean).join(',');



	let win;

	try {
		win = window.open(url, name, params);
		console.log("my origin " + win?.origin);
		win?.postMessage("hello", "*");
	}
	catch (err) {
		throw new Error(`${WINDOW_NOT_OPENED} - ${err}`);
	}

	if (!win || window.closed) {
		throw new Error(`${WINDOW_NOT_OPENED} - blocked`);
	}

	return win;
}
