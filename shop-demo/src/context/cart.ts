import { CartState, ProductItem, PRODUCT_SPECIAL } from './cart-reducer'

/**
 * Create a new static product list to be used the shopping inventory list
 *
 * @returns ProductItem[]
 */
export const makeStaticProducts = (): ProductItem[] => {
  return [
    {
      id: 'p1',
      title: 'Apple',
      price: 1.6,
      image: '/images/apple.jpg',
      description:
        'An apple a day keeps the doctor away. Buy one, get one free special.',
      special: PRODUCT_SPECIAL.TWO_FOR_ONE,
    },
    {
      id: 'p2',
      title: 'Orange',
      price: 1.25,
      image: '/images/orange.jpg',
      description: 'Fresh Florida oranges. 3 for the price of 2 special',
      special: PRODUCT_SPECIAL.THREE_FOR_TWO,
    },
  ]
}

/**
 * Creates an empty Shopping Cart object used for resetting the shopping cart state
 *
 * @returns CarState
 */
export const makeEmptyCart = (): CartState => {
  return {
    items: [],
    totals: {
      subTotal: 0,
      tax: 0,
      discounts: 0,
      total: 0,
    },
    totalItemCount: 0,
  }
}
