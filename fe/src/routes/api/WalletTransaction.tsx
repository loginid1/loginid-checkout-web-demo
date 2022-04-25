import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { AuthService } from "../../services/auth";

export default function AlgoTransaction() {
    return (
        <AlgoTransactionConfirmation/>
    );
}

function AlgoTransactionConfirmation() {
    return (
        <div>Transaction</div>
    );
}
