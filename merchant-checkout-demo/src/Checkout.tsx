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

import { useState, useEffect } from "react";
import CheckoutSDK, { CheckoutRequest } from "./lib/CheckoutSDK/checkout";
import { AppBar, Badge, Button, Container, createTheme, Divider, Stack, ThemeProvider, Toolbar, Typography } from "@mui/material";
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Grid from '@mui/material/Grid2';

const wallet = new CheckoutSDK(process.env.REACT_APP_CHECKOUT_BASEURL || '', true, "checkout")
const callback_url = window.location.origin + "/callback";

//const merchant_template = process.env.REACT_APP_MERCHANT || "a";
let merchant_template = process.env.REACT_APP_MERCHANT || "b";

export function CheckoutPage() {
    const merchantA_request: CheckoutRequest = {
        merchant: "EStore",
        preid: "",
        subtotal: "624.99",
        tax: "81.24",
        total: "718.29",
        shipping: "12.00",
        desc: "item",
        callback: callback_url,
        cid:"",
    }
    const merchantB_request: CheckoutRequest = {
        merchant: "ZSports",
        preid: "",
        subtotal: "120.33",
        tax: "7.24",
        total: "127.57",
        shipping: "0.00",
        desc: "item",
        callback: callback_url,
        cid:"",

    }
    const [screenwidth, setScreenWidth] = useState(600);
    const [username, setUsername] = useState<string>('');
    const [preid, setPreid] = useState<string>("");
    useEffect(() => {
        if (window) {
            setScreenWidth(window.innerWidth);
            console.log(window.innerWidth);
        }
        getPreID();
    }, []);




    const getPreID = async () => {
        //const id = await wallet.preID();
        //setPreid(id.token);
    }
    async function checkout() {
        try {
            let c_request = merchantB_request;
            if (merchant_template === "a") {
                c_request = merchantA_request;
            }
            c_request.preid = preid;
            const result = await wallet.checkout(c_request);
            console.log("checkout result: ", result);

        } catch (e) {
            console.log(e);
        }

    }
    function RenderMerchant() {

        if (merchant_template === "a") {
            return <CheckoutA screenwidth={screenwidth} request={merchantA_request} submit={checkout} />
        } else {
            return <CheckoutB screenwidth={screenwidth} request={merchantB_request} submit={checkout} />
        }
    }

    return (<>
        <RenderMerchant />
    </>);
}

export interface CheckoutProps {
    screenwidth: number;
    request: CheckoutRequest;
    submit: () => void;
}
function CheckoutA(props: CheckoutProps) {
    const theme = createTheme({
        palette: {
            primary: {
                main: "#003BD1",
                contrastText: "#fff",
            },
            secondary: {
                main: "#FFF176",
            },
        },
    });
    return (<>
        <ThemeProvider theme={theme}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} align="left">
                        {props.request.merchant}
                    </Typography>
                    <Badge badgeContent={2} color="secondary">
                        <ShoppingCart />
                    </Badge>

                </Toolbar>
            </AppBar>
            <Container maxWidth="sm">
                <div>

                    <Typography variant="h6" component="h6" align="left" sx={{ mt: 4, textDecoration: "underline 2px #FFF176", textUnderlineOffset: "8px" }} noWrap>
                        Order Summary
                    </Typography>
                </div>
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ m: 2 }}>
                    <Grid size={2}>
                        <img src="/items/tablet.jpg" width="64" height="64"></img>
                    </Grid>
                    <Grid size={8} display="flex" justifyContent="start" alignItems="center">
                        <Stack>
                            <Typography variant="body1">Chromebook tablet</Typography>
                            <Typography variant="caption" align="left">$499.00 x 1</Typography>
                        </Stack>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="center" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>$499.00</Typography>
                    </Grid>
                </Grid>
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ m: 2 }}>
                    <Grid size={2}>
                        <img src="/items/headset.jpg" width="64" height="64"></img>
                    </Grid>
                    <Grid size={8} display="flex" justifyContent="start" alignItems="center">
                        <Stack>
                            <Typography variant="body1">Noice canceling headphone</Typography>
                            <Typography variant="caption" align="left">$125.00 x 1</Typography>
                        </Stack>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="center" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>$125.00</Typography>
                    </Grid>
                </Grid>
                <Divider sx={{ mt: 4, mb: 4 }} />
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ m: 2, mt: 4 }}>
                    <Grid size={10} display="flex" justifyContent="start" alignItems="center">
                        <Typography variant="caption">Subtotal</Typography>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" >${props.request.subtotal}</Typography>
                    </Grid>
                    <Grid size={10} display="flex" justifyContent="start" alignItems="center">
                        <Typography variant="caption">Tax</Typography>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" >${props.request.tax}</Typography>
                    </Grid>
                    <Grid size={10} display="flex" justifyContent="start" alignItems="center">
                        <Typography variant="caption">Shipping Fee</Typography>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" >${props.request.shipping}</Typography>
                    </Grid>
                    <Grid size={10} display="flex" justifyContent="start" alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total</Typography>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>${props.request.total}</Typography>
                    </Grid>
                </Grid>
                <Button variant="contained" sx={{ textTransform: "none" }} fullWidth onClick={props.submit}>Pay with ABC Bank</Button>
            </Container>
        </ThemeProvider>
    </>);

}

function CheckoutB(props: CheckoutProps) {
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
        },
    });
    return (<>
        <ThemeProvider theme={theme}>

            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} align="left">
                        {props.request.merchant}
                    </Typography>
                    <Badge badgeContent={1} color="secondary">
                        <ShoppingCart />
                    </Badge>

                </Toolbar>
            </AppBar>
            <Container maxWidth="sm">
                <Typography variant="h6" component="h6" align="left" sx={{ mt: 4 }}>
                    Order Summary
                </Typography>
                <Divider />
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ m: 2 }}>
                    <Grid size={2}>
                        <img src="/items/running-shoe.jpg" width="64" height="64"></img>
                    </Grid>
                    <Grid size={8} display="flex" justifyContent="start" alignItems="center">
                        <Stack>
                            <Typography variant="body1">Running shoes</Typography>
                            <Typography variant="caption" align="left" >$120.33 x 1</Typography>
                        </Stack>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" >$120.33</Typography>
                    </Grid>
                </Grid>
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} sx={{ m: 2, mt: 4 }}>
                    <Grid size={10} display="flex" justifyContent="start" alignItems="center">
                        <Typography variant="caption">Subtotal</Typography>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>${props.request.subtotal}</Typography>
                    </Grid>
                    <Grid size={10} display="flex" justifyContent="start" alignItems="center">
                        <Typography variant="caption">Tax</Typography>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>${props.request.tax}</Typography>
                    </Grid>
                    <Grid size={10} display="flex" justifyContent="start" alignItems="center">
                        <Typography variant="caption">Shipping Fee</Typography>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>${props.request.shipping}</Typography>
                    </Grid>
                    <Grid size={10} display="flex" justifyContent="start" alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Total</Typography>
                    </Grid>
                    <Grid size={2} display="flex" justifyContent="end" alignItems="end" justifyItems="end">
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>${props.request.total}</Typography>
                    </Grid>
                </Grid>
                <Button variant="outlined" sx={{ textTransform: "none" }} fullWidth onClick={props.submit}>Pay with ABC Bank</Button>
            </Container>
        </ThemeProvider>
    </>);

}

