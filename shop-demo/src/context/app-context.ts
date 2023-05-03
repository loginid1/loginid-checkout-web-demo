import React from 'react'
import { ProductItem, CartActions, CartState } from './cart-reducer'

/**
 * App context definition interface
 */
export interface AppContext {
  products: Array<ProductItem>
  cart: CartState
  cartDispatcher: React.Dispatch<CartActions>
}

// Create the app context
const appContext = React.createContext<AppContext | null>(null)

export default appContext
