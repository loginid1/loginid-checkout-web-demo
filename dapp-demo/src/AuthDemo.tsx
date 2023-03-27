import React, { useEffect, useState } from "react";

import { Routes, Route, Link, Navigate } from "react-router-dom";
import "./AuthDemo.css";
import { FederatedSDK } from "./lib/FederatedSDK";
import Pricing from "./Pricing";

const wallet = new FederatedSDK(process.env.REACT_APP_VAULT_URL || "");
export function AuthDemo() {
	useEffect(() => {
		wallet.signUp();
	});

	return (
		<div>
			<Pricing />
		</div>
	);
}
