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
import Button from '@material-ui/core/Button'

//import { Link } from 'react-router-dom'

import Header from '../components/Header'
import Product from '../components/Product'

import AppContext from '../context/app-context'
//import { CART_ACTION, ProductItem } from '../context/cart-reducer'

/**
 * Product listing page
 *
 * @param {*} props
 * @returns ProductsPage
 */
const ProductsPage = (props: any) => {
  const context = useContext(AppContext)

  // Make the JSS styles
  const classes = makeStyles((theme: Theme) =>
    createStyles({
      productCard: {
        minWidth: 275,
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

  return (
    <React.Fragment>
      <Header title="Products" />
      <Container maxWidth="sm" className={classes.productItems}>
        {context.products.map((product) => (
          <Product key={product.id} item={product} />
        ))}
        <Container className={classes.checkoutContainer}>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            component={Link}
            to="cart"
          >
            Go To Shopping Cart
          </Button>
        </Container>
      </Container>
    </React.Fragment>
  )
}

export default ProductsPage
