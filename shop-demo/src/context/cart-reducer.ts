import { makeEmptyCart } from './cart'

/**
 * Cart reducer actions
 */
export enum CART_ACTION {
  ADD_PRODUCT_TO_CART,
  REMOVE_PRODUCT_FROM_CART,
  DELETE_PRODUCT_FROM_CART,
  EMPTY_CART,
  CHECKOUT_CART,
}

/**
 * Product item specials
 */
export enum PRODUCT_SPECIAL {
  NONE,
  TWO_FOR_ONE,
  THREE_FOR_TWO,
}

/**
 * Product item definition interface
 */
export interface ProductItem {
  id: string
  title: string
  price: number
  description: string
  image: string
  special: PRODUCT_SPECIAL
}

/**
 * Cart item definition interface
 */
export interface CartItem {
  product: ProductItem
  quantity: number
}

/**
 * Shopping cart totals definition interface
 */
export interface CartTotals {
  subTotal: number
  tax: number
  discounts: number
  total: number
}

/**
 * Shopping cart state definition interface
 */
export interface CartState {
  items: Array<CartItem>
  totals: CartTotals
  totalItemCount: number
}

/**
 * Cart reducer method actions signatures
 */
export type CartActions =
  | { type: CART_ACTION.ADD_PRODUCT_TO_CART; payload: ProductItem }
  | { type: CART_ACTION.REMOVE_PRODUCT_FROM_CART; payload: string }
  | { type: CART_ACTION.DELETE_PRODUCT_FROM_CART; payload: string }
  | { type: CART_ACTION.EMPTY_CART; payload: undefined }
  | { type: CART_ACTION.CHECKOUT_CART; payload: CartTotals }

/**
 * Add a product to the current shopping cart
 *
 * @param {ProductItem} product
 * @param {CartState} state
 * @returns CartState
 */
const addProductToCart = (
  product: ProductItem,
  state: CartState
): CartState => {
  // Copy current state
  const updatedCart = { ...state }

  // Find exiting cart item
  const updatedItemIndex = updatedCart.items.findIndex(
    (item) => item.product.id === product.id
  )

  if (updatedItemIndex < 0) {
    // Add new cart item
    const newProduct = { ...product }
    updatedCart.items.push({ product: newProduct, quantity: 1 })
  } else {
    // Update exiting cart item quantity
    const updatedItem = {
      ...updatedCart.items[updatedItemIndex],
    }

    updatedItem.quantity++
    updatedCart.items[updatedItemIndex] = updatedItem
  }

  // Recalculate the shopping cart totals
  updatedCart.totals = calculateCartTotals(updatedCart)

  return updatedCart
}

/**
 * Remove a product count from the current shopping cart
 *
 * @param {string} productId
 * @param {CartState} state
 * @returns CartState
 */
const removeProductFromCart = (
  productId: string,
  state: CartState
): CartState => {
  // Copy current state
  const updatedCart = { ...state }

  // Find exiting cart item
  const updatedItemIndex = updatedCart.items.findIndex(
    (item) => item.product.id === productId
  )

  // Update exiting cart item quantity
  const updatedItem = {
    ...updatedCart.items[updatedItemIndex],
  }

  updatedItem.quantity--

  // If quantity is zero then remove the item from shopping cart
  if (updatedItem.quantity <= 0) {
    updatedCart.items.splice(updatedItemIndex, 1)
  } else {
    updatedCart.items[updatedItemIndex] = updatedItem
  }

  // Recalculate the shopping cart totals
  updatedCart.totals = calculateCartTotals(updatedCart)

  return updatedCart
}

/**
 * Delete a product from the shopping cart entirely
 *
 * @param {string} productId
 * @param {CartState} state
 * @returns CartState
 */
const deleteProductFromCart = (
  productId: string,
  state: CartState
): CartState => {
  // Copy current state
  const updatedCart = { ...state }

  // Find exiting cart item
  const updatedItemIndex = updatedCart.items.findIndex(
    (item) => item.product.id === productId
  )

  // Remove the item from the shopping cart
  updatedCart.items.splice(updatedItemIndex, 1)

  // Recalculate the shopping cart totals
  updatedCart.totals = calculateCartTotals(updatedCart)

  return updatedCart
}

/**
 * Empty the shopping cart entirely
 *
 * @returns CartState
 */
const emptyCart = (): CartState => makeEmptyCart()

/**
 * Perform the shopping cart checkout transaction and empty the cart
 *
 * @param {CartTotals} totals
 * @returns CartState
 */
const checkoutCart = (totals: CartTotals): CartState => {
  return emptyCart()
}

/**
 * Calculate all the shopping cart totals
 *
 * @param {CartItem[]} cart
 * @returns CartTotals
 */
const calculateCartTotals = (cart: CartState): CartTotals => {
  // Create new totals with zero balances
  const totals: CartTotals = {
    subTotal: 0,
    tax: 0,
    discounts: 0,
    total: 0,
  }

  cart.totalItemCount = 0

  // Iterate all the shopping cart items
  for (const cartItem of cart.items) {
    // Calculate the total item in the cart
    cart.totalItemCount += cartItem.quantity

    // Add sub total based on quantity
    totals.subTotal += (cartItem.product.price * cartItem.quantity * 100) / 100

    if (cartItem.product.special === PRODUCT_SPECIAL.TWO_FOR_ONE) {
      // Two for one discount calculation
      const twoPacks = Math.floor(cartItem.quantity / 2)
      totals.discounts += twoPacks * cartItem.product.price
    } else if (cartItem.product.special === PRODUCT_SPECIAL.THREE_FOR_TWO) {
      // Thee for two discount calculation
      const threePacks = Math.floor(cartItem.quantity / 3)
      totals.discounts += threePacks * cartItem.product.price
    }
  }

  // Calculate tax
  totals.tax =
    Math.round((totals.subTotal - totals.discounts) * 0.0825 * 100) / 100

  // Calculate final total
  totals.total =
    Math.round((totals.subTotal - totals.discounts + totals.tax) * 100) / 100

  return totals
}

/**
 * Shopping cart main reducer action switcher
 *
 * @param {CartState} state
 * @param {CartAction} action
 * @returns CartState
 */
const cartReducer = (state: CartState, action: CartActions): CartState => {
  // console.log('cartReducer - action', action)

  switch (action.type) {
    case CART_ACTION.ADD_PRODUCT_TO_CART:
      return addProductToCart(action.payload, state)
    case CART_ACTION.REMOVE_PRODUCT_FROM_CART:
      return removeProductFromCart(action.payload, state)
    case CART_ACTION.DELETE_PRODUCT_FROM_CART:
      return deleteProductFromCart(action.payload, state)
    case CART_ACTION.EMPTY_CART:
      return emptyCart()
    case CART_ACTION.CHECKOUT_CART:
      return checkoutCart(action.payload)
    default:
      return state
  }
}

export default cartReducer
