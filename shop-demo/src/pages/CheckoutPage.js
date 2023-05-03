import React, { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import Container from '@material-ui/core/Container'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import Typography from '@material-ui/core/Typography'
import Breadcrumbs from '@material-ui/core/Breadcrumbs'
import UILink from '@material-ui/core/Link'

import Header from '../components/Header'
import AppContext from '../context/app-context'
import { CART_ACTION } from '../context/cart-reducer'

/**
 * Final checkout page
 *
 * @param {*} props
 * @returns CheckoutPage
 */
const CheckoutPage = (props: any) => {
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
    })
  )()

  /**
   * Checkout the cart on the load of this page
   * this will be a full checkout system later
   *
   */
  useEffect(() => {
    checkoutCart()
  }, [])

  /**
   * Cart dispatcher for checking out the shopping cart
   *
   * @param {CartTotals} totals
   */
  const checkoutCart = () => {
    cartDispatcher({
      type: CART_ACTION.CHECKOUT_CART,
      payload: cartTotals,
    })
  }

  return (
    <React.Fragment>
      <Header title="Checkout Cart" />
      <Container maxWidth="sm" className={classes.productItems}>
        <Breadcrumbs aria-label="breadcrumb">
          <UILink color="inherit" component={Link} to="">
            Products
          </UILink>
          <Typography color="textPrimary">Checkout</Typography>
        </Breadcrumbs>
        <Card className={classes.productCard} variant="outlined">
          <CardContent>
            <Typography variant="h5" component="h2">
              Your checkout is now completed
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </React.Fragment>
  )
}

export default CheckoutPage
