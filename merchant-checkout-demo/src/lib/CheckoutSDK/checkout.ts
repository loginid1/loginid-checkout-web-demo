/*
 *   Copyright (c) 2024 LoginID Inc
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import { CID } from "./crypto";
import { stringToBase64Url } from "./encoding";
import { Message, MessageType, MessagingService } from "./messaging";
import { closePopup, defaultOptions, openPopup } from "./popup";


export interface CheckoutResult {
	id: string;
	email?: string;
	token?: string;
	callback?: string;
	passkey: boolean;
	error?: string;
}

export interface CheckoutResponse {
	email?: string;
	token?: string;
	id: string;
	passkey: boolean;
	callback?: string;
	error?: string;
}

export interface CheckoutRequest {
	preid: string;
	subtotal: string;
	total: string;
	tax: string;
	shipping: string;
	desc: string;
	callback: string;
	merchant: string;
	cid: string;

}

export interface DiscoverResult {
	embed: boolean;
}

export interface IDResponse {
	token: string;
}

const base64logo = "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgdmlld0JveD0iMCAwIDU0MCAxNjIiCiAgIHZlcnNpb249IjEuMSIKICAgaWQ9InN2ZzUxIgogICB3aWR0aD0iNTQwIgogICBoZWlnaHQ9IjE2MiIKICAgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnMKICAgICBpZD0iZGVmczgiPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICBpZD0ibGluZWFyLWdyYWRpZW50IgogICAgICAgeDE9Ijc5LjIzMDAwMyIKICAgICAgIHkxPSItMS4yNCIKICAgICAgIHgyPSIxNzAuMzQiCiAgICAgICB5Mj0iODkuODYwMDAxIgogICAgICAgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcAogICAgICAgICBvZmZzZXQ9IjAiCiAgICAgICAgIHN0b3AtY29sb3I9IiMwMDZkZmYiCiAgICAgICAgIGlkPSJzdG9wMyIgLz4KICAgICAgPHN0b3AKICAgICAgICAgb2Zmc2V0PSIwLjg3IgogICAgICAgICBzdG9wLWNvbG9yPSIjMjZkYmZmIgogICAgICAgICBpZD0ic3RvcDQiIC8+CiAgICAgIDxzdG9wCiAgICAgICAgIG9mZnNldD0iMSIKICAgICAgICAgc3RvcC1jb2xvcj0iIzJjZWJmZiIKICAgICAgICAgaWQ9InN0b3A1IiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC0yIgogICAgICAgeDE9IjcxLjY1MDAwMiIKICAgICAgIHkxPSI2LjM0MDAwMDIiCiAgICAgICB4Mj0iMTYyLjc1OTk5IgogICAgICAgeTI9Ijk3LjQ0MDAwMiIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiIC8+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtMyIKICAgICAgIHgxPSI2NC4wNyIKICAgICAgIHkxPSIxMy45MiIKICAgICAgIHgyPSIxNTUuMTc5OTkiCiAgICAgICB5Mj0iMTA1LjAzIgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC00IgogICAgICAgeDE9IjU2LjQ4IgogICAgICAgeTE9IjIxLjUiCiAgICAgICB4Mj0iMTQ3LjU5IgogICAgICAgeTI9IjExMi42MSIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiIC8+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtNSIKICAgICAgIHgxPSI3OS4yMzAwMDMiCiAgICAgICB5MT0iLTEuMjQiCiAgICAgICB4Mj0iMTcwLjM0IgogICAgICAgeTI9Ijg5Ljg2MDAwMSIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiIC8+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtNiIKICAgICAgIHgxPSI2NC4wNyIKICAgICAgIHkxPSIxMy45MiIKICAgICAgIHgyPSIxNTUuMTc5OTkiCiAgICAgICB5Mj0iMTA1LjAzIgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC03IgogICAgICAgeDE9Ijg2LjgyIgogICAgICAgeTE9Ii04LjgyOTk5OTkiCiAgICAgICB4Mj0iMTc3LjkyIgogICAgICAgeTI9IjgyLjI3OTk5OSIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiIC8+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtOCIKICAgICAgIHgxPSI3OS4yMzAwMDMiCiAgICAgICB5MT0iLTEuMjQiCiAgICAgICB4Mj0iMTcwLjM0IgogICAgICAgeTI9Ijg5Ljg2MDAwMSIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiIC8+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtOSIKICAgICAgIHgxPSI4Ni44MDk5OTgiCiAgICAgICB5MT0iLTguODI5OTk5OSIKICAgICAgIHgyPSIxNzcuOTIiCiAgICAgICB5Mj0iODIuMjc5OTk5IgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC0xMCIKICAgICAgIHgxPSI2NC4wNTk5OTgiCiAgICAgICB5MT0iMTMuOTIiCiAgICAgICB4Mj0iMTU1LjE3IgogICAgICAgeTI9IjEwNS4wMyIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiIC8+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtMTEiCiAgICAgICB4MT0iNzEuNjUwMDAyIgogICAgICAgeTE9IjYuMzQwMDAwMiIKICAgICAgIHgyPSIxNjIuNzU5OTkiCiAgICAgICB5Mj0iOTcuNDQ5OTk3IgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC0xMiIKICAgICAgIHgxPSI3MS42NTAwMDIiCiAgICAgICB5MT0iNi4zNDAwMDAyIgogICAgICAgeDI9IjE2Mi43NTk5OSIKICAgICAgIHkyPSI5Ny40NDk5OTciCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50IiAvPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICBpZD0ibGluZWFyLWdyYWRpZW50LTEzIgogICAgICAgeDE9IjU2LjQ4IgogICAgICAgeTE9IjIxLjUxIgogICAgICAgeDI9IjE0Ny41OSIKICAgICAgIHkyPSIxMTIuNjEiCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50IiAvPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICBpZD0ibGluZWFyLWdyYWRpZW50LTE0IgogICAgICAgeDE9Ijc5LjIzMDAwMyIKICAgICAgIHkxPSItMS4yNCIKICAgICAgIHgyPSIxNzAuMzQiCiAgICAgICB5Mj0iODkuODcwMDAzIgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC0xNSIKICAgICAgIHgxPSI1Ni40OCIKICAgICAgIHkxPSIyMS41MSIKICAgICAgIHgyPSIxNDcuNTkiCiAgICAgICB5Mj0iMTEyLjYyIgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC0xNiIKICAgICAgIHgxPSI4Ni40NTk5OTkiCiAgICAgICB5MT0iLTguNDcwMDAwMyIKICAgICAgIHgyPSIxNzcuNTYiCiAgICAgICB5Mj0iODIuNjM5OTk5IgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC0xNyIKICAgICAgIHgxPSI3MS42NTAwMDIiCiAgICAgICB5MT0iNi4zNDAwMDAyIgogICAgICAgeDI9IjE2Mi43NTk5OSIKICAgICAgIHkyPSI5Ny40NDk5OTciCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50IiAvPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICBpZD0ibGluZWFyLWdyYWRpZW50LTE4IgogICAgICAgeDE9IjY0LjA1OTk5OCIKICAgICAgIHkxPSIxMy45MiIKICAgICAgIHgyPSIxNTUuMTciCiAgICAgICB5Mj0iMTA1LjAzIgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC0xOSIKICAgICAgIHgxPSI1Ni40OCIKICAgICAgIHkxPSIyMS41IgogICAgICAgeDI9IjE0Ny41OSIKICAgICAgIHkyPSIxMTIuNjEiCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50IiAvPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICBpZD0ibGluZWFyLWdyYWRpZW50LTIwIgogICAgICAgeDE9IjU2LjQ4IgogICAgICAgeTE9IjIxLjUiCiAgICAgICB4Mj0iMTQ3LjU5IgogICAgICAgeTI9IjExMi42MSIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiIC8+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtMjEiCiAgICAgICB4MT0iNjQuMDU5OTk4IgogICAgICAgeTE9IjEzLjkyIgogICAgICAgeDI9IjE1NS4xNyIKICAgICAgIHkyPSIxMDUuMDMiCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50IiAvPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICBpZD0ibGluZWFyLWdyYWRpZW50LTIyIgogICAgICAgeDE9IjY4LjYxMDAwMSIKICAgICAgIHkxPSIxODIuMjEwMDEiCiAgICAgICB4Mj0iMTkwLjAyIgogICAgICAgeTI9IjYwLjc5OTk5OSIKICAgICAgIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KICAgICAgPHN0b3AKICAgICAgICAgb2Zmc2V0PSIwIgogICAgICAgICBzdG9wLWNvbG9yPSIjMDA2ZGZmIgogICAgICAgICBpZD0ic3RvcDYiIC8+CiAgICAgIDxzdG9wCiAgICAgICAgIG9mZnNldD0iMC4xMyIKICAgICAgICAgc3RvcC1jb2xvcj0iIzA2N2RmZiIKICAgICAgICAgaWQ9InN0b3A3IiAvPgogICAgICA8c3RvcAogICAgICAgICBvZmZzZXQ9IjEiCiAgICAgICAgIHN0b3AtY29sb3I9IiMyY2ViZmYiCiAgICAgICAgIGlkPSJzdG9wOCIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtMjMiCiAgICAgICB4MT0iODguNjk5OTk3IgogICAgICAgeTE9Ii0xMC43MSIKICAgICAgIHgyPSIxNzkuOCIKICAgICAgIHkyPSI4MC40MDAwMDIiCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50IiAvPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICBpZD0ibGluZWFyLWdyYWRpZW50LTI0IgogICAgICAgeDE9IjQ1Ljg2MDAwMSIKICAgICAgIHkxPSIxNTkuNDUiCiAgICAgICB4Mj0iMTY3LjIxMDAxIgogICAgICAgeTI9IjM4LjA5OTk5OCIKICAgICAgIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQtMjIiIC8+CiAgICA8bGluZWFyR3JhZGllbnQKICAgICAgIGlkPSJsaW5lYXItZ3JhZGllbnQtMjUiCiAgICAgICB4MT0iODAuMDciCiAgICAgICB5MT0iLTIuMDc5OTk5OSIKICAgICAgIHgyPSIxNzEuMTciCiAgICAgICB5Mj0iODkuMDI5OTk5IgogICAgICAgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIgLz4KICAgIDxsaW5lYXJHcmFkaWVudAogICAgICAgaWQ9ImxpbmVhci1ncmFkaWVudC0yNiIKICAgICAgIHgxPSI1NC42MTk5OTkiCiAgICAgICB5MT0iMTY4LjIyIgogICAgICAgeDI9IjE3NS45OCIKICAgICAgIHkyPSI0Ni44Njk5OTkiCiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50LTIyIiAvPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50IgogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MSIKICAgICAgIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIgogICAgICAgeDE9Ijc5LjIzMDAwMyIKICAgICAgIHkxPSItMS4yNCIKICAgICAgIHgyPSIxNzAuMzQiCiAgICAgICB5Mj0iODkuODYwMDAxIiAvPgogICAgPGxpbmVhckdyYWRpZW50CiAgICAgICB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50LTIyIgogICAgICAgaWQ9ImxpbmVhckdyYWRpZW50MiIKICAgICAgIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIgogICAgICAgeDE9IjY4LjYxMDAwMSIKICAgICAgIHkxPSIxODIuMjEwMDEiCiAgICAgICB4Mj0iMTkwLjAyIgogICAgICAgeTI9IjYwLjc5OTk5OSIgLz4KICA8L2RlZnM+CiAgPGcKICAgICBzdHlsZT0iaXNvbGF0aW9uOmlzb2xhdGUiCiAgICAgaWQ9Imc1MSIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTMuNTUzNTU1LC0xOC41KSI+CiAgICA8ZwogICAgICAgaWQ9IkxheWVyXzEiCiAgICAgICBkYXRhLW5hbWU9IkxheWVyIDEiPgogICAgICA8cGF0aAogICAgICAgICBkPSJtIDExOS40LDQ0LjEgYSA1LjIsNS4yIDAgMSAwIC01LjIsLTUuMiA1LjIsNS4yIDAgMCAwIDUuMiw1LjIgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6dXJsKCNsaW5lYXJHcmFkaWVudDEpIgogICAgICAgICBpZD0icGF0aDE0IiAvPgogICAgICA8cGF0aAogICAgICAgICBkPSJtIDExOS40LDU5LjMgYSA1LjIsNS4yIDAgMCAwIDAsLTEwLjQgNS4yLDUuMiAwIDAgMCAwLDEwLjQgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6dXJsKCNsaW5lYXItZ3JhZGllbnQtMikiCiAgICAgICAgIGlkPSJwYXRoMTUiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGQ9Im0gMTE5LjQsNzQuNCBhIDUuMiw1LjIgMCAxIDAgMCwtMTAuMyA1LjIsNS4yIDAgMSAwIDAsMTAuMyB6IgogICAgICAgICBzdHlsZT0iZmlsbDp1cmwoI2xpbmVhci1ncmFkaWVudC0zKSIKICAgICAgICAgaWQ9InBhdGgxNiIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxMTkuNCw4OS42IGEgNS4yLDUuMiAwIDEgMCAtNS4yLC01LjIgNS4yLDUuMiAwIDAgMCA1LjIsNS4yIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTQpIgogICAgICAgICBpZD0icGF0aDE3IiAvPgogICAgICA8cGF0aAogICAgICAgICBkPSJtIDEwNC4yLDI4LjkgYSA1LjIsNS4yIDAgMSAwIC01LjEsLTUuMSA1LjEsNS4xIDAgMCAwIDUuMSw1LjEgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6dXJsKCNsaW5lYXItZ3JhZGllbnQtNSkiCiAgICAgICAgIGlkPSJwYXRoMTgiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGQ9Im0gMTA0LjIsNTkuMyBhIDUuMiw1LjIgMCAxIDAgLTUuMSwtNS4yIDUuMiw1LjIgMCAwIDAgNS4xLDUuMiB6IgogICAgICAgICBzdHlsZT0iZmlsbDp1cmwoI2xpbmVhci1ncmFkaWVudC02KSIKICAgICAgICAgaWQ9InBhdGgxOSIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxMTkuNCwyOC45IGEgNS4yLDUuMiAwIDEgMCAwLC0xMC4zIDUuMiw1LjIgMCAxIDAgMCwxMC4zIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTcpIgogICAgICAgICBpZD0icGF0aDIwIiAvPgogICAgICA8cGF0aAogICAgICAgICBkPSJtIDEzNC42LDU5LjMgYSA1LjIsNS4yIDAgMSAwIC01LjIsLTUuMiA1LjEsNS4xIDAgMCAwIDUuMiw1LjIgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6dXJsKCNsaW5lYXItZ3JhZGllbnQtOCkiCiAgICAgICAgIGlkPSJwYXRoMjEiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGQ9Im0gMTM0LjYsNDQuMSBhIDUuMiw1LjIgMCAxIDAgLTUuMiwtNS4yIDUuMSw1LjEgMCAwIDAgNS4yLDUuMiB6IgogICAgICAgICBzdHlsZT0iZmlsbDp1cmwoI2xpbmVhci1ncmFkaWVudC05KSIKICAgICAgICAgaWQ9InBhdGgyMiIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxMzQuNiw4OS42IGEgNS4yLDUuMiAwIDEgMCAtNS4yLC01LjIgNS4xLDUuMSAwIDAgMCA1LjIsNS4yIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTEwKSIKICAgICAgICAgaWQ9InBhdGgyMyIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxMzQuNiw3NC40IGEgNS4yLDUuMiAwIDEgMCAtNS4yLC01LjEgNS4xLDUuMSAwIDAgMCA1LjIsNS4xIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTExKSIKICAgICAgICAgaWQ9InBhdGgyNCIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxMDQuMiw0NC4xIGEgNS4yLDUuMiAwIDEgMCAtNS4xLC01LjIgNS4yLDUuMiAwIDAgMCA1LjEsNS4yIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTEyKSIKICAgICAgICAgaWQ9InBhdGgyNSIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSA3My45LDQ0LjEgYSA1LjIsNS4yIDAgMSAwIC01LjIsLTUuMiA1LjIsNS4yIDAgMCAwIDUuMiw1LjIgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6dXJsKCNsaW5lYXItZ3JhZGllbnQtMTMpIgogICAgICAgICBpZD0icGF0aDI2IiAvPgogICAgICA8cGF0aAogICAgICAgICBkPSJtIDE0OS43LDY0LjEgYSA1LjIsNS4yIDAgMCAwIDAsMTAuMyBoIDEuMSBhIDI2LjYsMjYuNiAwIDAgMCAyLjgsLTguNSA1LjQsNS40IDAgMCAwIC0zLjksLTEuOCB6IgogICAgICAgICBzdHlsZT0iZmlsbDp1cmwoI2xpbmVhci1ncmFkaWVudC0xNCkiCiAgICAgICAgIGlkPSJwYXRoMjciIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGQ9Im0gNTguNywyOC45IGEgNS4yLDUuMiAwIDEgMCAtNS4xLC01LjEgNS4xLDUuMSAwIDAgMCA1LjEsNS4xIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTE1KSIKICAgICAgICAgaWQ9InBhdGgyOCIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxNDkuNyw0OC45IGEgNS4yLDUuMiAwIDAgMCAwLDEwLjQgNS4yLDUuMiAwIDAgMCAzLjgsLTEuNyAyNi43LDI2LjcgMCAwIDAgLTMsLTguNiB6IgogICAgICAgICBzdHlsZT0iZmlsbDp1cmwoI2xpbmVhci1ncmFkaWVudC0xNikiCiAgICAgICAgIGlkPSJwYXRoMjkiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGQ9Im0gODkuMSwyOC45IGEgNS4yLDUuMiAwIDEgMCAtNS4yLC01LjEgNS4xLDUuMSAwIDAgMCA1LjIsNS4xIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTE3KSIKICAgICAgICAgaWQ9InBhdGgzMCIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSA4OS4xLDQ0LjEgYSA1LjIsNS4yIDAgMSAwIDAsLTEwLjMgNS4yLDUuMiAwIDEgMCAwLDEwLjMgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6dXJsKCNsaW5lYXItZ3JhZGllbnQtMTgpIgogICAgICAgICBpZD0icGF0aDMxIiAvPgogICAgICA8cGF0aAogICAgICAgICBkPSJtIDEwNC4yLDc0LjQgYSA1LjIsNS4yIDAgMSAwIC01LjEsLTUuMSA1LjEsNS4xIDAgMCAwIDUuMSw1LjEgeiIKICAgICAgICAgc3R5bGU9ImZpbGw6dXJsKCNsaW5lYXItZ3JhZGllbnQtMTkpIgogICAgICAgICBpZD0icGF0aDMyIiAvPgogICAgICA8cGF0aAogICAgICAgICBkPSJtIDg5LjEsNTkuMyBhIDUuMiw1LjIgMCAxIDAgMCwtMTAuNCA1LjIsNS4yIDAgMSAwIDAsMTAuNCB6IgogICAgICAgICBzdHlsZT0iZmlsbDp1cmwoI2xpbmVhci1ncmFkaWVudC0yMCkiCiAgICAgICAgIGlkPSJwYXRoMzMiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGQ9Im0gNzMuOSwyOC45IGEgNS4yLDUuMiAwIDEgMCAtNS4yLC01LjEgNS4xLDUuMSAwIDAgMCA1LjIsNS4xIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTIxKSIKICAgICAgICAgaWQ9InBhdGgzNCIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0iTSAxODMuNyw4MC44IDE1NC4yLDUxLjIgYSA1LjMsNS4zIDAgMCAwIC0zLjcsLTIuMiA1LDUgMCAwIDEgMy45LDIuOCA1LjksNS45IDAgMCAxIDAuNSwyLjMgNC44LDQuOCAwIDAgMSAtMS40LDMuNSAyOC4yLDI4LjIgMCAwIDEgMC4xLDguMiA1LjIsNS4yIDAgMCAxIDEuMywzLjUgNS4xLDUuMSAwIDAgMSAtNC4xLDUgMjksMjkgMCAwIDEgLTQuNyw2LjUgbCAtOTEsOTAuOSBhIDUuMiw1LjIgMCAwIDAgMy43LDguOSBoIDYwLjYgYSA1LjEsNS4xIDAgMCAwIDMuNywtMS41IGwgNjAuNiwtNjAuNyBhIDI2LjYsMjYuNiAwIDAgMCAwLC0zNy42IHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyR3JhZGllbnQyKSIKICAgICAgICAgaWQ9InBhdGgzNSIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxNTAuNSw0OSBhIDI2LjcsMjYuNyAwIDAgMSAzLDguNiA0LjgsNC44IDAgMCAwIDEuNCwtMy41IDUuMiw1LjIgMCAwIDAgLTQuNCwtNS4xIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTIzKSIKICAgICAgICAgaWQ9InBhdGgzNiIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxNTAuNSw0OSBhIDI2LjcsMjYuNyAwIDAgMSAzLDguNiA0LjgsNC44IDAgMCAwIDEuNCwtMy41IDUuMiw1LjIgMCAwIDAgLTQuNCwtNS4xIHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTI0KSIKICAgICAgICAgaWQ9InBhdGgzNyIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxNTQuOSw2OS4zIGEgNS4yLDUuMiAwIDAgMCAtMS4zLC0zLjUgMjYuNiwyNi42IDAgMCAxIC0yLjgsOC41IDUuMSw1LjEgMCAwIDAgNC4xLC01IHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTI1KSIKICAgICAgICAgaWQ9InBhdGgzOCIgLz4KICAgICAgPHBhdGgKICAgICAgICAgZD0ibSAxNTQuOSw2OS4zIGEgNS4yLDUuMiAwIDAgMCAtMS4zLC0zLjUgMjYuNiwyNi42IDAgMCAxIC0yLjgsOC41IDUuMSw1LjEgMCAwIDAgNC4xLC01IHoiCiAgICAgICAgIHN0eWxlPSJmaWxsOnVybCgjbGluZWFyLWdyYWRpZW50LTI2KSIKICAgICAgICAgaWQ9InBhdGgzOSIgLz4KICAgICAgPHBhdGgKICAgICAgICAgc3R5bGU9ImZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjUzLjMzMzNweDt3aGl0ZS1zcGFjZTpwcmU7ZmlsbDojMDA2ZGZmO3N0cm9rZS13aWR0aDoyLjA0MjI3IgogICAgICAgICBkPSJtIDI3NS4zMzMxMiwxNDIuMTM4NjEgaCAtMTkuNzU5NDggbCAtNS4xMjY1MiwtMTcuMTA1ODIgaCAtMjcuNDc0MTUgbCAtNS4xMjY1MSwxNy4xMDU4MiBIIDE5OC41ODQ2OSBMIDIyNS45NTkzLDU3LjUxODgzNCBoIDIxLjk5OTIzIHogbSAtMjkuNTE0ODEsLTMyLjYyMDM5IC05LjEwODI3LC0zMC4zNDcxNzkgLTkuMTA4MjgsMzAuMzQ3MTc5IHogbSAxMDMuNTc1NTcsNi43MDU5NSBxIDAsNi4xMzc2MSAtMi4xODk5NywxMC45NjgxNSAtMi4xNDAxOSw0LjgzMDU3IC01LjkyMjg3LDguMDEzMDQgLTQuMzc5OTMsMy43NTA3OCAtOS42NTU3Nyw1LjM0MiAtNS4yMjYwNiwxLjU5MTI1IC0xMy4yODkxMywxLjU5MTI1IGggLTMyLjM1MTggViA1Ny41MTg4MzQgaCAyOC43NjgyMiBxIDguOTU4OTYsMCAxMy4wOTAwNSwwLjY4MTk2IDQuMTgwODUsMC42ODE5NTkgOC4yNjIxNCwzLjAxMTk5MiA0LjIzMDYyLDIuNDQzNjg1IDYuMjcxMjgsNi41OTIyNjkgMi4wOTA0Miw0LjA5MTc1NyAyLjA5MDQyLDkuMzc2OTM0IDAsNi4xMzc2MzYgLTIuODM3MDEsMTAuODU0NTI3IC0yLjgzNyw0LjY2MDA0MyAtOC4wMTMyOCw3LjI3NDIyOSB2IDAuNDU0NjMyIHEgNy4yNjY3MSwxLjY0ODA3MyAxMS40OTczMyw2LjgxOTU5MyA0LjI4MDM5LDUuMTcxNTMgNC4yODAzOSwxMy42MzkyIHogTSAzMjQuOTA2MDUsODEuNDQ0MjQ3IHEgMCwtMi4xMDI3MjcgLTAuOTQ1NjYsLTQuMjA1NDMyIC0wLjg5NTksLTIuMTAyNzA1IC0zLjIzNTE5LC0zLjEyNTY0NSAtMi4wOTA0MywtMC45MDkyNjUgLTUuMjI2MDUsLTAuOTY2MTEzIC0zLjA4NTg2LC0wLjExMzY5NiAtOC43MTAxMSwtMC4xMTM2OTYgaCAtMS43OTE3OSBWIDkwLjkzNDc5IGggMi45ODYzMiBxIDQuNTI5MjUsMCA3LjcxNDY1LC0wLjE3MDQzNiAzLjE4NTQyLC0wLjE3MDQzNSA1LjAyNjk4LC0xLjEzNjYxMyAyLjU4ODE1LC0xLjMwNzA3MiAzLjM4NDQ5LC0zLjM1Mjk1IDAuNzk2MzYsLTIuMTAyNzI3IDAuNzk2MzYsLTQuODMwNTQ0IHogbSA0LjY3ODU4LDM0LjQzODk0MyBxIDAsLTQuMDM0OTQgLTEuMzkzNjIsLTYuMTk0NDcgLTEuMzQzODYsLTIuMjE2MzggLTQuNjI4NzksLTMuMjk2MTQgLTIuMjM5NzYsLTAuNzM4NzkgLTYuMTcxNzQsLTAuNzk1NjEgLTMuOTMxOTksLTAuMDU2NyAtOC4yMTIzOCwtMC4wNTY3IGggLTQuMTgwODUgdiAyMS4wODM5IGggMS4zOTM2MiBxIDguMDYzMDUsMCAxMS41NDcxLC0wLjA1NjcgMy40ODQwMywtMC4wNTY3IDYuNDIwNTksLTEuNDc3NiAyLjk4NjMyLC0xLjQyMDc0IDQuMDgxMzEsLTMuNzUwNzcgMS4xNDQ3NiwtMi4zODY4NCAxLjE0NDc2LC01LjQ1NTY2IHogbSA2Ny41NDA2MiwyNy45MDM0OSBxIC04LjI2MjE3LDAgLTE1LjI4MDAxLC0yLjc4NDY2IC02Ljk2ODA4LC0yLjc4NDY3IC0xMS45OTUwNiwtOC4yOTcxNyAtNS4wMjY5NiwtNS41MTI1MyAtNy44MTQyMSwtMTMuNzUyODUgLTIuNzM3NDYsLTguMjQwMzQgLTIuNzM3NDYsLTE5LjAzODAzOSAwLC0xMC4wNTg4OTMgMi42Mzc5MiwtMTguMjQyNDA5IDIuNjM3OTIsLTguMTgzNTE1IDcuNjY0ODgsLTE0LjAzNjk5OCA0LjgyNzg5LC01LjYyNjE1NiAxMS45NDUyOSwtOC42OTQ5NzQgNy4xNjcxOCwtMy4wNjg4MTkgMTUuNjI4NDIsLTMuMDY4ODE5IDQuNjc4NTYsMCA4LjQxMTQ3LDAuNjI1MTM0IDMuNzgyNjYsMC41NjgzMDcgNi45NjgwOCwxLjUzNDQyIDMuMzM0NzIsMS4wNzk3NjYgNi4wMjI0MSwyLjQ0MzY4NSAyLjczNzQ2LDEuMzA3MDcxIDQuNzc4MTIsMi40NDM2ODUgdiAyMC41MTU1OTMgaCAtMi4xODk5OCBxIC0xLjM5MzYxLC0xLjM2MzkyIC0zLjUzMzgsLTMuMjM5Mjk4IC0yLjA5MDQzLC0xLjg3NTM5OSAtNC43NzgxMiwtMy42OTM5NTEgLTIuNzM3NDYsLTEuODE4NTUyIC01LjkyMjg3LC0zLjA2ODgxOCAtMy4xODU0LC0xLjI1MDI0NSAtNi44MTg3NiwtMS4yNTAyNDUgLTQuMDMxNTQsMCAtNy42NjQ5LDEuNDc3NTcyIC0zLjYzMzM2LDEuNDIwNzQ1IC02LjcxOTIyLDQuNzczNzE3IC0yLjkzNjU1LDMuMjM5Mjk3IC00Ljc3ODExLDguNTgxMzIyIC0xLjc5MTc5LDUuMzQyMDAyIC0xLjc5MTc5LDEyLjk1NzIxIDAsNy45NTYyMTMgMS45NDExMSwxMy4yOTgyMTMgMS45OTA4Nyw1LjM0MjAyIDQuOTc3Miw4LjQxMDgyIDMuMDM2MDksMy4xMjU2NyA2Ljc2OSw0LjQ4OTU5IDMuNzMyODksMS4zMDcwNyA3LjM2NjI1LDEuMzA3MDcgMy40ODQwNSwwIDYuODY4NTQsLTEuMTkzNDIgMy40MzQyNiwtMS4xOTM0NCA2LjMyMTA1LC0zLjIzOTMyIDIuNDM4ODIsLTEuNjQ4MDUgNC41MjkyNSwtMy41MjM0NSAyLjA5MDQzLC0xLjg3NTM4IDMuNDM0MjYsLTMuMjM5MyBoIDEuOTkwODkgdiAyMC4yMzE0NiBxIC0yLjc4NzI1LDEuNDIwNzUgLTUuMzI1NjEsMi42NzA5OSAtMi41MzgzNywxLjI1MDI3IC01LjMyNTYxLDIuMTU5NTYgLTMuNjMzMzYsMS4xOTM0MiAtNi44MTg3NiwxLjgxODU1IC0zLjE4NTQyLDAuNjI1MTMgLTguNzU5ODcsMC42MjUxMyB6IgogICAgICAgICBpZD0idGV4dDUxIgogICAgICAgICBhcmlhLWxhYmVsPSJBQkMiIC8+CiAgICAgIDxwYXRoCiAgICAgICAgIGQ9Im0gNDY2LjEyMzE3LDEyNy4xNDA3NCBxIDAsMy42MzA0NyAtMS4yMzk1NCw2LjQxMDU1IC0xLjIzOTU1LDIuNzgwMDggLTMuMzM0OTcsNC41Nzg5NiAtMi40NzkwOSwyLjE1ODY2IC01LjQ1OTksMy4wNzQ0NCAtMi45NTEzMSwwLjkxNTggLTcuNTI1ODIsMC45MTU4IEggNDMyLjk4MDA2IFYgOTMuNDE5OTk2IGggMTMuMDE1MjUgcSA0LjgxMDYxLDAgNy4yMDExNywwLjM5MjQ4MSAyLjM5MDU2LDAuMzkyNDgxIDQuNTc0NTEsMS42MzUzMzYgMi40MjAwNiwxLjQwNjQwMyAzLjUxMjA2LDMuNjMwNDY3IDEuMDkxOTgsMi4xOTEzNSAxLjA5MTk4LDUuMjY1NzkgMCwzLjQ2Njk0IC0xLjU5MzcxLDUuOTE5OTQgLTEuNTkzNzEsMi40MjAzMSAtNC4yNDk4NiwzLjg5MjEyIHYgMC4yNjE2NSBxIDQuNDU2NDUsMS4wMTM5MiA3LjAyNDA5LDQuMzUwMDIgMi41Njc2MiwzLjMwMzM5IDIuNTY3NjIsOC4zNzI5NCB6IG0gLTkuODI3ODMsLTIxLjk0NjI4IHEgMCwtMS43NjYxNyAtMC41MzEyMywtMi45NzYzMyAtMC41MzEyNCwtMS4yMTAxNCAtMS43MTE3NiwtMS45NjI0MSAtMS4zODcxMSwtMC44ODMwODIgLTMuMzY0NDcsLTEuMDc5MzE2IC0xLjk3NzM4LC0wLjIyODk2IC00Ljg5OTE3LC0wLjIyODk2IGggLTYuOTY1MDYgViAxMTMuMDExNCBoIDcuNTU1MzIgcSAyLjc0NDcyLDAgNC4zNjc5MywtMC4yOTQzOCAxLjYyMzIsLTAuMzI3MDYgMy4wMTAzMywtMS4zMDgyNiAxLjM4NzExLC0wLjk4MTIxIDEuOTQ3ODUsLTIuNTE4NDQgMC41OTAyNiwtMS41Njk5MiAwLjU5MDI2LC0zLjY5NTg2IHogbSAzLjc0ODE1LDIyLjIwNzk0IHEgMCwtMi45NDM2MSAtMC43OTY4NCwtNC42NzcwOCAtMC43OTY4NSwtMS43MzM0NiAtMi44OTIyOCwtMi45NDM2MSAtMS40MTY2MiwtMC44MTc2OCAtMy40NTMwMywtMS4wNDY2MiAtMi4wMDY4OCwtMC4yNjE2NiAtNC44OTkxNiwtMC4yNjE2NiBoIC05LjE3ODUzIHYgMTguMTE5NiBoIDcuNzMyMzkgcSAzLjgzNjcsMCA2LjI4NjI4LC0wLjQyNTIgMi40NDk1OCwtMC40NTc4OSA0LjAxMzc3LC0xLjYzNTMzIDEuNjUyNzMsLTEuMjc1NTYgMi40MjAwNiwtMi45MTA5MiAwLjc2NzM0LC0xLjYzNTMzIDAuNzY3MzQsLTQuMjE5MTggeiBtIDM5LjU0NzQ0LDE0LjcxODA5IGggLTUuNTE4OTIgdiAtMy44OTIxMyBxIC0wLjczNzgyLDAuNTU2MDQgLTIuMDA2OSwxLjU2OTk1IC0xLjIzOTU0LDAuOTgxMTkgLTIuNDIwMDYsMS41Njk5MiAtMS4zODcxMiwwLjc1MjI2IC0zLjE4NzQsMS4yNDI4NSAtMS44MDAyOSwwLjUyMzMyIC00LjIyMDM1LDAuNTIzMzIgLTQuNDU2NDksMCAtNy41NTUzNSwtMy4yNzA2OSAtMy4wOTg4NiwtMy4yNzA2OCAtMy4wOTg4NiwtOC4zNDAyNCAwLC00LjE1Mzc4IDEuNTkzNzEsLTYuNzA0OTIgMS42MjMyLC0yLjU4MzgzIDQuNjA0MDEsLTQuMDU1NjMgMy4wMTAzMywtMS40NzE4MSA3LjIzMDcsLTEuOTk1MTIgNC4yMjAzNiwtMC41MjMzMiA5LjA2MDUsLTAuNzg0OTggdiAtMC45NDg0OSBxIDAsLTIuMDkzMjQgLTAuNjc4ODEsLTMuNDY2OTIgLTAuNjQ5MjgsLTEuMzczNjkgLTEuODg4ODIsLTIuMTU4NjUgLTEuMTgwNTIsLTAuNzUyMjcgLTIuODMzMjQsLTEuMDEzOTIgLTEuNjUyNzUsLTAuMjYxNjUgLTMuNDUzMDMsLTAuMjYxNjUgLTIuMTgzOTgsMCAtNC44Njk2NiwwLjY1NDE0IC0yLjY4NTY4LDAuNjIxNDMgLTUuNTQ4NDUsMS44MzE1OCBoIC0wLjI5NTEzIHYgLTYuMjQ3MDEgcSAxLjYyMzIyLC0wLjQ5MDYxIDQuNjkyNTgsLTEuMDc5MzMgMy4wNjkzNSwtMC41ODg3MiA2LjA1MDE3LC0wLjU4ODcyIDMuNDgyNTMsMCA2LjA1MDE2LDAuNjU0MTQgMi41OTcxNSwwLjYyMTQzIDQuNDg1OTcsMi4xNTg2NiAxLjg1OTMzLDEuNTA0NTEgMi44MzMyNywzLjg5MjExIDAuOTczOTEsMi4zODc2IDAuOTczOTEsNS45MTk5MyB6IG0gLTUuNTE4OTIsLTguOTk0MzggdiAtMTAuMTcxODMgcSAtMi41MzgxMiwwLjE2MzUzIC01Ljk5MTE1LDAuNDkwNiAtMy40MjM1LDAuMzI3MDYgLTUuNDMwMzksMC45NDg1IC0yLjM5MDU0LDAuNzUyMjYgLTMuODY2MiwyLjM1NDg5IC0xLjQ3NTY1LDEuNTY5OTIgLTEuNDc1NjUsNC4zNTAwMSAwLDMuMTM5ODcgMS43MTE3NCw0Ljc0MjUgMS43MTE3NywxLjU2OTkxIDUuMjIzOCwxLjU2OTkxIDIuOTIxOCwwIDUuMzQxODcsLTEuMjQyODYgMi40MjAwNywtMS4yNzU1NSA0LjQ4NTk4LC0zLjA0MTcyIHogbSA0My43Njc4MSw4Ljk5NDM4IGggLTUuNTQ4NDUgdiAtMjAuODAxNTUgcSAwLC0yLjUxODQ0IC0wLjI2NTYyLC00LjcwOTggLTAuMjY1NjIsLTIuMjI0MDcgLTAuOTczOTMsLTMuNDY2OTMgLTAuNzM3ODIsLTEuMzczNjggLTIuMTI0OTMsLTIuMDI3ODIgLTEuMzg3MTIsLTAuNjg2ODQgLTMuNjAwNiwtMC42ODY4NCAtMi4yNzI1LDAgLTQuNzUxNTksMS4yNDI4NiAtMi40NzkwOSwxLjI0Mjg2IC00Ljc1MTYsMy4xNzI1NyB2IDI3LjI3NzUxIGggLTUuNTQ4NDQgdiAtMzYuNTMzNTUgaCA1LjU0ODQ0IHYgNC4wNTU2NCBxIDIuNTk3MTYsLTIuMzg3NTkgNS4zNzEzNiwtMy43Mjg1NyAyLjc3NDIzLC0xLjM0MSA1LjY5NjAyLC0xLjM0MSA1LjM0MTg2LDAgOC4xNDU1OSwzLjU2NTA2IDIuODAzNzUsMy41NjUwNCAyLjgwMzc1LDEwLjI2OTk1IHogbSA0MC42MDk5LDAgaCAtNy4zMTkyMiBsIC0xMy4yMjE4MywtMTUuOTkzNjYgLTMuNjAwNTksMy43OTQwMSB2IDEyLjE5OTY1IGggLTUuNTQ4NDUgViA5MS4yMjg2MzMgaCA1LjU0ODQ1IHYgMzIuNjQxNDI3IGwgMTYuMDI1NTcsLTE4LjI4MzEyIGggNi45OTQ1OSBsIC0xNS4zMTcyNiwxNi44NzY3MyB6IgogICAgICAgICBpZD0idGV4dDUyIgogICAgICAgICBzdHlsZT0iZm9udC1zaXplOjY3LjEyNDNweDtmaWxsOiMwMDZkZmY7c3Ryb2tlLXdpZHRoOjAuODUyMTc1IgogICAgICAgICBhcmlhLWxhYmVsPSJCYW5rIiAvPgogICAgPC9nPgogIDwvZz4KPC9zdmc+Cg==";

export default class CheckoutSDK {
	baseURL = "http://localhost:3000";
	//mMessage: MessagingService;
	mTarget: Window | null = null;
	mMain: HTMLDivElement | null = null;
	mBackground: HTMLDivElement | null = null;
	mApi?: string | null = null;
	autoClose: boolean = true;
	keyprefix = "loginid";
	constructor(
		url: string,
		autoClose: boolean,
		api?: string | null,
	) {
		if (url !== "") {
			this.baseURL = url;
		}
		this.mApi = api;
		this.autoClose = autoClose;
		//this.mMessage = new MessagingService(FidoVaultSDK.baseURL);
	}

	prepareIframe(url: string): Window | null {
		const height = 420;
		let width = window.innerWidth;
		if (width > 480) {
			width = 480;
		}
		let largeScreen = true;
		if (window.innerWidth < 600) {
			largeScreen = false;
		}
		//var link = this.baseURL + "/checkout";
		var link = url;

		var main = document.createElement("div");
		console.log("height: ", window.screen.height, window.screen.availHeight);

		var background = document.createElement("div");
		background.style.display = "block";
		background.style.position = "fixed";
		background.style.backgroundColor = "#cccccccc";
		background.style.top = "0";
		background.style.left = "0";
		background.style.width = "100%";
		background.style.height = "100%";
		main.style.zIndex = "9997";

		main.style.display = "block";
		main.style.border = "none";
		main.style.position = "fixed";
		main.style.zIndex = "9998";
		main.style.backgroundColor = "#fff";
		//main.style.right = "0";
		if (largeScreen) {
			main.style.left = "" + (window.innerWidth / 2 - width / 2) + "px";
			main.style.top = "" + (window.innerHeight / 2 - (height + 32) / 2) + "px";
		} else {
			main.style.left = "" + (window.innerWidth / 2 - width / 2) + "px";
			main.style.top = "" + (window.innerHeight - (height + 32)) + "px";
		}
		main.style.boxShadow = "0 4px 8px 0 rgba(0,0,0,0.2)";
		main.style.width = "" + width + "px";


		var image = document.createElement("img");
		image.setAttribute("src", "data:image/svg+xml;base64," + base64logo);
		image.style.display = "relative";
		image.style.left = "8px";
		image.style.top = "8px";
		image.style.padding = "8px";
		image.style.zIndex = "9999";
		image.style.float = "left";
		image.style.height = "32px";
		image.style.width = "96px";

		var close = document.createElement("span");
		close.innerHTML = "Cancel";
		close.style.zIndex = "9999";
		close.style.display = "block";
		close.style.fontSize = "12px";
		close.style.fontWeight = "500";
		close.style.fontFamily = "sans-serif";
		close.style.float = "right";
		close.style.color = "#0d70d2";
		close.style.position = "relative";
		close.style.paddingRight = "8px";
		close.style.padding = "8px";
		close.onclick = function () {
			//main.style.display="none";
			main.remove();
			background.remove();
		};

		var iframe = document.createElement("iframe");
		iframe.style.border = "none";
		iframe.style.position = "relative";
		//iframe.width = "320px";
		iframe.width = "" + width + "px";
		iframe.height = "" + height + "px";
		//iframe.height = "420px";
		iframe.id = "loginid-auth";
		iframe.allow = "publickey-credentials-get *; publickey-credentials-create * ";

		iframe.setAttribute("src", link);
		main.appendChild(image);
		main.appendChild(close);
		main.appendChild(iframe);

		document.body.appendChild(background);
		document.body.appendChild(main);
		if (!largeScreen) {
			main.animate([{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 500 });
		}
		this.mMain = main;
		this.mBackground = background;
		return iframe.contentWindow;
	}
	/**
	 *
	 */

	async checkoutFrame(request: CheckoutRequest): Promise<CheckoutResult> {

		if (this.mMain != null) {
			this.mMain?.remove();
		}
		if (this.mBackground != null) {
			this.mBackground.remove();
		}

		let mMessage = new MessagingService("*");
		//let mMessage = new MessagingService("https://crab-polite-lately.ngrok-free.app");
		//let mMessage = new MessagingService("http://localhost:3005");
		mMessage.closeEvent = () => {
			if (this.mMain != null) {
				this.mMain.remove();
			}
			if (this.mBackground != null) {
				this.mBackground.remove();
			}
		};

		const url = this.baseURL + "/checkout?data=" + stringToBase64Url(JSON.stringify(request));
		this.mTarget = this.prepareIframe(url);

		if (this.mTarget == null) {
			return Promise.reject({ message: "no session" });
		}
		let isLoad = await mMessage.pingForResponse(this.mTarget, 20000);
		if (!isLoad) {
			return Promise.reject({ message: "communication timeout" });
		}
		try {
			let response = await mMessage.sendMessage(
				this.mTarget,
				JSON.stringify(request),
				"init"
			);

			//console.log("response ",response);
			let resp = this.parseResponse(response);
			//console.log("parse response ",resp);
			let result: CheckoutResult = {
				id: resp.id,
				callback: resp.callback,
				passkey: resp.passkey,

			};

			if (resp.error) {
				result.error = resp.error
			}

			document.cookie = `loginid-token=${resp.token}; SameSite=None; Secure`;
			return Promise.resolve(result);
		} catch (e) {
			return Promise.reject(e);
		} finally {
			if (this.autoClose) {
				if (this.mMain != null) {
					this.mMain.remove();
				}
			}
		}
	}

	async checkoutPopup(request: CheckoutRequest): Promise<CheckoutResult> {
		closePopup(this.mTarget);
		this.mTarget = openPopup(
			this.baseURL + "/sdk/auth_p",
			"auth_new",
			defaultOptions
		);
		let mMessage = new MessagingService("*");
		let isLoad = await mMessage.pingForResponse(this.mTarget, 20000);
		if (!isLoad) {
			return Promise.reject({ message: "communication timeout" });
		}

		// focus back to popup
		window.addEventListener("focus", () => {
			this.mTarget?.focus();
		});

		try {
			let response = await mMessage.sendMessage(
				this.mTarget,
				JSON.stringify(request),
				"init"
			);

			let resp = this.parseResponse(response);
			let result: CheckoutResult = {
				id: resp.id,
				callback: resp.callback,
				passkey: resp.passkey,
			};
			return Promise.resolve(result);
		} catch (e) {
			return Promise.reject(e);
		} finally {
			if (this.autoClose) {
				closePopup(this.mTarget);
			}
		}
	}

	async checkout(request: CheckoutRequest): Promise<void> {
		// discover embed or redirect flow
		var embbed = false;
		// get latest checkout
		const cid = await CID.getLatest()
		if(cid.valid) {
			embbed = true;
		} else {
			embbed = await this.discover();
		}

		if (embbed ) {
			request.cid = cid.token
			const result = await this.checkoutFrame(request);
			const baseCallback = result.callback;
			const base64 = stringToBase64Url(JSON.stringify(result));
			const callback = baseCallback + `?data=${base64}`;
			document.location.href = callback;
		} else {
			request.cid = cid.token
			const url = this.baseURL + "/checkout?data=" + stringToBase64Url(JSON.stringify(request));
			document.location.href = url;
		}
	}

	async discover(): Promise<boolean> {
		try {

			var link = this.baseURL + "/discover";
			const target = this.prepareDiscoverIframe(link);
			if (target == null) {
				return Promise.reject("iframe not created");
			}
			let mMessage = new MessagingService("*");

			let response = await mMessage.pingForID(target, 5000);
			let resp: DiscoverResult = JSON.parse(response);
			return Promise.resolve(resp.embed);

		} catch (e) {
			return Promise.resolve(false);
		}
	}

	parseResponse(response: string): CheckoutResponse {
		let resp: CheckoutResponse = JSON.parse(response);
		return resp;
	}


	prepareDiscoverIframe(url: string): Window | null {

		var main = document.createElement("div");

		var iframe = document.createElement("iframe");
		iframe.style.border = "none";
		iframe.style.position = "relative";
		iframe.width = "0px";
		iframe.height = "0px";
		iframe.id = "loginid-preid";

		iframe.setAttribute("src", url);
		//main.appendChild(close);
		main.appendChild(iframe);

		document.body.appendChild(main);
		//this.mMain = main;
		return iframe.contentWindow;
	}


}

