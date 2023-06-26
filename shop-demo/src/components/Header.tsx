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
import { WalletSDK } from '@loginid/wallet-sdk'
import ShoppingCartIcon from '@material-ui/icons/ShoppingCart'
import AccountCircleIcon from '@material-ui/icons/AccountCircle'
import { useHistory } from 'react-router-dom'

const wallet = new WalletSDK(process.env.REACT_APP_VAULT_URL || '', process.env.REACT_APP_WALLET_API )
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
  const [anchorLogout, setAnchorLogout] = useState<any|null>(null)
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
    let account = wallet.getAccount()
    setUsername(account)
  }, [])

  const handleCart = async () => {
    let account = wallet.getAccount()
    if (account != '') {
      navigate.push('/cart')
    } else {
      let result = await wallet.signup();
      console.log(result);
      setUsername(result.claims.sub)
    }
  }

  const handleSignin = async()=>{
      let result = await wallet.signup()
      console.log(result);
      setUsername(result.claims.sub)
  }

  const handleLogout = () => {
    setUsername('')
    wallet.logout()
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
                onClick={(e ) => {
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
