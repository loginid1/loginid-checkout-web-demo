import React, { useReducer } from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'

import './App.css'
import ProductsPage from './pages/ProductsPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import AppContext from './context/app-context'
import cartReducer, { ProductItem } from './context/cart-reducer'
import { makeStaticProducts, makeEmptyCart } from './context/cart'

/**
 * Products catalog. This is currently a static array
 * but will be loaded from an API call and stored in to
 * the application context state
 */
const products: Array<ProductItem> = makeStaticProducts()

/**
 * Main Application component with context and route handling
 *
 * @returns App
 */
function App() {
  // Initialize the shopping cart reducer and default empty cart
  const [cartState, cartDispatcher] = useReducer(cartReducer, makeEmptyCart())

  return (
    <AppContext.Provider value={{ products, cart: cartState, cartDispatcher }}>
      <BrowserRouter>
        <Switch>
          <Route path="/" component={ProductsPage} exact />
          <Route path="/cart" component={CartPage} exact />
          <Route path="/checkout" component={CheckoutPage} exact />
        </Switch>
      </BrowserRouter>
    </AppContext.Provider>
  )
}

export default App
