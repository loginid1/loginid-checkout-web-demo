import { makeStyles, Theme, createStyles, Card, CardContent, Grid, Typography, CardMedia, CardActions, Button } from '@material-ui/core'
import React, { useContext } from 'react'

import AppContext from '../context/app-context'
import { CART_ACTION, ProductItem } from '../context/cart-reducer'

/**
 * Product component
 *
 * @param {*} props
 * @returns Product
 */
const Product = (props: any) => {
  const context = useContext(AppContext)
  const { cartDispatcher } = context
  const { item }: { item: ProductItem } = props

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
    cartDispatcher({ type: CART_ACTION.ADD_PRODUCT_TO_CART, payload: item })
  }

  return (
    <Card className={classes.productCard} variant="outlined">
      <CardContent>
        <Grid container>
          <Grid item xs={8} >

        <Typography variant="h5" component="h2">
          {item.title}
        </Typography>
        <Typography color="textSecondary">$ {item.price.toFixed(2)}</Typography>
        <Typography
          className={classes.productDesc}
          variant="body2"
          component="p"
        >
          {item.description}
        </Typography>
          </Grid>
          <Grid item xs={4} >
            
      <CardMedia 
        component="img"
        width="150"
        height="150"
        image={item.image}
        alt="product image"
      ></CardMedia>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={() => addToCart()}
        >
          Add To Cart
        </Button>
      </CardActions>
    </Card>
  )
}

export default Product
