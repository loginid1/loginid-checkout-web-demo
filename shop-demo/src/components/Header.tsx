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

import {
  makeStyles,
  Theme,
  createStyles,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Chip,
  Menu,
  MenuItem,
  Popper,
  Button,
} from '@material-ui/core'
import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AppContext from '../context/app-context'
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart'
import AccountCircleIcon from '@material-ui/icons/AccountCircle'
import { useHistory } from 'react-router-dom'
import CheckoutSDK, { CheckoutRequest } from '../lib/CheckoutSDK/checkout'

const wallet = new CheckoutSDK(process.env.REACT_APP_CHECKOUT_BASEURL || '', true, "checkout")
/**
 * Page app bar component
 *
 * @param {*} props
 * @returns Header
 */
const Header = (props: any) => {
  const context = useContext(AppContext)
  const [username, setUsername] = useState<string>('')
  const [logout, setLogout] = useState(false)
  const [anchorLogout, setAnchorLogout] = useState<any | null>(null)
  const [preid, setPreid] = useState<string>("");
  const navigate = useHistory()
  // Make the JSS styles
  const classes = makeStyles((theme: Theme) =>
    createStyles({
      appBarWrapper: {
        flexGrow: 1,
      },
      appBar: {},
      pageTitle: {
        flexGrow: 1,
      },
    })
  )()

  useEffect(() => {

    getPreID();
    let account = ""
    setUsername(account)
  }, [])

  const getPreID = async () => {
    const id = await wallet.preID();
    setPreid(id.token);
  }

  const handleCart = async () => {
  }

  const handleSignin = async () => {
    try {
      const callback_url = window.location.origin + "/callback";
      const request: CheckoutRequest = {
        preid: preid,
        subtotal: "100.00",
        tax: "0.00",
        total: "100.00",
        shipping: "0.0",
        desc: "item",
        callback: callback_url,
      }
      const result = await wallet.checkout(request);
      console.log("checkout result: ", result);

    } catch (e) {
      console.log(e);
    }
  }

  const handleLogout = () => {
    setUsername('')
    setLogout(false)
  }

  return (
    <div className={classes.appBarWrapper}>
      <AppBar position="static" className={classes.appBar}>
        <Toolbar>
          <Typography variant="h6" className={classes.pageTitle}>
            {props.title}
          </Typography>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="cart"
            onClick={handleCart}
          >
            <Badge badgeContent={context.cart.totalItemCount} color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </IconButton>
          {username === '' &&
            <IconButton
              edge="start"
              color="inherit"
              aria-label="account"
              onClick={handleSignin}
            >
              <AccountCircleIcon />
            </IconButton>
          }
          {username != '' && (
            <>
              <Chip
                aria-describeby="logout-menu"
                aria-controls="logout-menu"
                aria-haspopup="true"
                label={username}
                onClick={(e) => {
                  setLogout(true)
                  setAnchorLogout(e.currentTarget)
                }}
              />
              <Popper
                id="logout-menu"
                anchorEl={anchorLogout}
                open={logout}
                keepMounted
              >

                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Popper>
            </>
          )}
        </Toolbar>
      </AppBar>
    </div>
  )
}

export default Header
