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

import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import Breadcrumbs from '@material-ui/core/Breadcrumbs'
import UILink from '@material-ui/core/Link'

import Header from '../components/Header'
import CartProduct from '../components/CartProduct'
import AppContext from '../context/app-context'
import { CART_ACTION } from '../context/cart-reducer'

/**
 * Shopping cart page
 *
 * @param {*} props
 * @returns CartPage
 */
const CartPage = (props: any) => {
  const context = useContext(AppContext)
  const { cartDispatcher } = context
  const { totals: cartTotals } = context.cart

  // Make the JSS styles
  const classes = makeStyles((theme: Theme) =>
    createStyles({
      productCard: {
        minWidth: 275,
        marginTop: theme.spacing(1),
      },
      productItems: {
        marginTop: theme.spacing(1),
      },
      checkoutContainer: {
        margin: 0,
        padding: 0,
        marginTop: theme.spacing(2),
      },
    })
  )()

  /**
   * Cart dispatcher for emptying the shopping cart
   *
   */
  const emptyCart = () => {
    cartDispatcher({
      type: CART_ACTION.EMPTY_CART,
    })
  }

  /**
   * Render the shopping cart items or empty cart message
   *
   */
  const renderCart = () => {
    if (context.cart.items.length) {
      return (
        <React.Fragment>
          {context.cart.items.map((cartItem) => (
            <CartProduct key={cartItem.product.id} item={cartItem} />
          ))}
          <Card className={classes.productCard} variant="outlined">
            <CardContent>
              <Typography>
                Sub Total: <strong>${cartTotals.subTotal.toFixed(2)}</strong>
              </Typography>
              <Typography>
                Tax: <strong>${cartTotals.tax.toFixed(2)}</strong>
              </Typography>
              <Typography>
                Discounts: <strong>${cartTotals.discounts.toFixed(2)}</strong>
              </Typography>
              <Typography>
                Total: <strong>${cartTotals.total.toFixed(2)}</strong>
              </Typography>
            </CardContent>
          </Card>
          <Container className={classes.checkoutContainer}>
            <Button
              variant="contained"
              size="small"
              color="primary"
              component={Link}
              to="checkout"
            >
              Checkout Cart
            </Button>{' '}
            <Button
              variant="contained"
              size="small"
              color="secondary"
              onClick={() => emptyCart()}
            >
              Empty Cart
            </Button>
          </Container>
        </React.Fragment>
      )
    } else {
      return (
        <React.Fragment>
          <Card className={classes.productCard} variant="outlined">
            <CardContent>
              <Typography variant="h5" component="h2">
                Your shopping cart it empty
              </Typography>
            </CardContent>
          </Card>
        </React.Fragment>
      )
    }
  }

  return (
    <React.Fragment>
      <Header title="Shopping Cart" />
      <Container maxWidth="sm" className={classes.productItems}>
        <Breadcrumbs aria-label="breadcrumb">
          <UILink color="inherit" component={Link} to="">
            Products
          </UILink>
          <Typography color="textPrimary">Cart</Typography>
        </Breadcrumbs>
        {renderCart()}
      </Container>
    </React.Fragment>
  )
}

export default CartPage
