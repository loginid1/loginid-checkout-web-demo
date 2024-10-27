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

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckoutResult } from "./lib/CheckoutSDK/checkout";
import { ThemeProvider } from "@emotion/react";
import { createTheme, AppBar, Toolbar, Typography, Container, Button } from "@mui/material";
import CheckCircle from '@mui/icons-material/CheckCircle';

let merchant_template = process.env.REACT_APP_MERCHANT || "b";
//let merchant_template =  "b";

export function CallbackPage() {
    const currentdate = new Date().toISOString();

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const query_data = searchParams.get("data");
        if (query_data) {
            const base64 = atob(query_data);
            const resp: CheckoutResult = JSON.parse(base64);
            // only save token if passkey exist
            if (resp.passkey) {
                localStorage.setItem("preid-token", resp.email);
            }
        }
    }, []);

    function handleBack (){ 
        window.document.location.href = "/";
    }

    function RenderView() {

        if (merchant_template === "a") {
            return <CallbackA name="EStore" amount="718.29" back={handleBack} />
        } else {
            return <CallbackB name="ZSports" amount="127.57" back={handleBack}/>
        }
    }

    return (<>
        <RenderView />
    </>);

}


export interface CallbackProps {
    name: string;
    amount: string;
    back: () => void;
}

function CallbackA(props: CallbackProps) {

    const theme = createTheme({
        palette: {
            primary: {
                main: "#003BD1",
                contrastText: "#fff",
            },
            secondary: {
                main: "#FFF176",
            },

            success: {
                main: "#76FF03",
            },
        },
    });
    return (

        <>
            <ThemeProvider theme={theme}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} align="center">
                            {props.name}
                        </Typography>

                    </Toolbar>
                </AppBar>
                <Container maxWidth="sm">
                <Typography variant="body1" sx={{mt: 4}}>Thank You For Your Purchase</Typography>
                <CheckCircle sx={{ fontSize: 128 , m: 4}} color="success"/>
                <Typography variant="h6">Order #123RB23178Y Confirmed</Typography>
                <Typography variant="body2" >Pay ${props.amount} through ABC Bank</Typography>
                <Button variant="contained" sx={{ mt: 4, textTransform: "none" }} fullWidth >Track Order</Button>
                <Button variant="text" sx={{ textTransform: "none" }} fullWidth onClick={props.back}>Return To Shopping</Button>
                </Container>
            </ThemeProvider>
        </>
    );

}

function CallbackB(props: CallbackProps) {

    const theme = createTheme({
        palette: {
            primary: {
                main: "#30b0c7",
                contrastText: "#fff",
            },
            secondary: {
                main: "#3700b3",
                contrastText: "#fff",
            },
            success: {
                main: "#76FF03",
            },
        },
    });
    return (
        <>
            <ThemeProvider theme={theme}>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} align="center">
                            {props.name}
                        </Typography>

                    </Toolbar>
                </AppBar>
                <Container maxWidth="sm">
                <Typography variant="body1" sx={{mt: 4}}>Thank You For Your Purchase</Typography>
                <CheckCircle sx={{ fontSize: 128 , m: 4}} color="success"/>
                <Typography variant="h6">Order #123RB23178Y Confirmed</Typography>
                <Typography variant="body2" >Pay ${props.amount} through ABC Bank</Typography>
                <Button variant="contained" sx={{ mt: 4, textTransform: "none" }} fullWidth >Track Order</Button>
                <Button variant="text" sx={{ textTransform: "none" }} fullWidth onClick={props.back}>Return To Shopping</Button>
                </Container>
            </ThemeProvider>
        </>
    );

}