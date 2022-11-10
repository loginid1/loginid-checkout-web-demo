


export interface PopupOptions {
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
 */
export const defaultOptions = <PopupOptions>{
	width: 400,
	height: 640,
	left: 0,
	top: 0,
	status: 1,
	toolbar: 0,
	menubar: 0,
	resizable: 1,
	scrollbars: 1,
};

/**
 **/

export function openPopup(url: string, name: string, options: PopupOptions = defaultOptions): Window {

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
	}
	catch (err) {
		throw new Error(`window loading error - ${err}`);
	}

	if (!win || window.closed) {
		throw new Error(`window loading error - blocked`);
	}

	return win;
}

export function closePopup(w: Window | null) {
	if (w && !w.closed) {
		try {
			w.close();
		}
		catch (err) {
			throw new Error(`${err}`);
		}
	}
}