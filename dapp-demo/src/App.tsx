import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { FidoVaultSDK, WalletTransaction } from "./lib/LoginidVaultSDK";
import algosdk from "algosdk";

function App() {
	const wallet = new FidoVaultSDK();
	async function handleEnableClick() {
		try {
			const result = await wallet.enable({ network: "sandnet" });
			if (result != null) {
				localStorage.setItem("test_account", result.accounts[0]);
			}
		} catch (e) {
			console.log(e);
		}
	}

	async function handleTransactionClick() {
		const token =
			process.env.REACT_APP_ALGO_CLIENT_TOKEN || "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
		const server = process.env.REACT_APP_ALGO_CLIENT_SERVER || "http://localhost";
		const port = process.env.REACT_APP_ALGO_CLIENT_PORT || 4001;
		const algodv2 = new algosdk.Algodv2(token, server, port);
		const suggestedParams = await algodv2.getTransactionParams().do();
		// construct a transaction note
		const note = new Uint8Array(Buffer.from("Hello World", "utf8"));
		const addr = localStorage.getItem("test_account");
		const receiver =
			"OJMOSX7LZR7LW7NORKEXERK34WF4H2A2YJA43UANQTGVL3ENDI3FSGQJQ4";
		if (addr == null) {
			alert("no address enable");
			return;
		}
		// create the transaction
		const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
			from: addr,
			to: receiver,
			amount: 100000,
			note,
			suggestedParams,
			// try adding another option to the list above by using TypeScript autocomplete (ctrl + space in VSCode)
		});
		let wTxn: WalletTransaction = {
			txn: Buffer.from(txn.toByte()).toString("base64"),
		};
		// Sign and post
		const res = await wallet.signAndPostTxns([wTxn]);
		console.log(res);
	}
	return (
		<div className="App">
			<header className="App-header">
				<p>Dapp demo</p>
				<a
					className="App-link"
					onClick={handleEnableClick}
					target="_blank"
					rel="noopener noreferrer"
				>
					Test Enable
				</a>
				<a
					className="App-link"
					onClick={handleTransactionClick}
					target="_blank"
					rel="noopener noreferrer"
				>
					Test Payment
				</a>
			</header>
		</div>
	);
}

export default App;
