import { makeStyles, Theme, createStyles, Card, CardContent, Typography, CardActions, ButtonGroup, Button } from '@material-ui/core'
import React, { useContext } from 'react'

import AppContext from '../context/app-context'
import { CART_ACTION, CartItem } from '../context/cart-reducer'
import AddIcon from '@material-ui/icons/Add'
import RemoveIcon from '@material-ui/icons/Remove'
import DeleteIcon from '@material-ui/icons/Delete'

/**
 * Cart product component
 *
 * @param {*} props
 * @returns CartProduct
 */
const CartProduct = (props: any) => {
  const context = useContext(AppContext)
  const { cartDispatcher } = context
  const { item }: { item: CartItem } = props

  // Make the JSS styles
  const classes = makeStyles((theme: Theme) =>
    createStyles({
      productCard: {
        minWidth: 275,
        marginTop: theme.spacing(1),
      },
      productDesc: {
        marginTop: theme.spacing(2),
      },
    })
  )()

  /**
   * Cart dispatcher for adding a product to the shopping cart
   *
   */
  const addToCart = () => {
    cartDispatcher({
      type: CART_ACTION.ADD_PRODUCT_TO_CART,
      payload: item.product,
    })
  }

  /**
   * Cart dispatcher for removing a product to the shopping cart
   *
   */
  const removeFromCart = () => {
    cartDispatcher({
      type: CART_ACTION.REMOVE_PRODUCT_FROM_CART,
      payload: item.product.id,
    })
  }

  /**
   * Cart dispatcher for deleting a product to the shopping cart
   *
   */
  const deleteFromCart = () => {
    cartDispatcher({
      type: CART_ACTION.DELETE_PRODUCT_FROM_CART,
      payload: item.product.id,
    })
  }

  return (
    <Card className={classes.productCard} variant="outlined">
      <CardContent>
        <Typography variant="h5" component="h2">
          {item.product.title}
        </Typography>
        <Typography color="textSecondary">
          $ {item.product.price.toFixed(2)}
        </Typography>
        <Typography color="textSecondary">Quantity: {item.quantity}</Typography>
      </CardContent>
      <CardActions>
        <ButtonGroup
          variant="contained"
          color="primary"
          aria-label="contained primary button group"
        >
          <Button
            size="small"
            color="inherit"
            aria-label="cart"
            onClick={() => addToCart()}
          >
            <AddIcon />
          </Button>
          <Button
            size="small"
            color="inherit"
            aria-label="cart"
            onClick={() => removeFromCart()}
          >
            <RemoveIcon />
          </Button>
          <Button
            size="small"
            color="inherit"
            aria-label="cart"
            onClick={() => deleteFromCart()}
          >
            <DeleteIcon />
          </Button>
        </ButtonGroup>
      </CardActions>
    </Card>
  )
}

export default CartProduct
