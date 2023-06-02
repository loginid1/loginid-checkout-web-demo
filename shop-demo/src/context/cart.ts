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
      title: 'Work wear-resistant shoes',
      price: 59.99,
      image: '/images/shoe-wresist.webp',
      description:
        'New work wear-resistant non-slip rubber shoes father shoes labor protection shoes men and women training.',
      special: PRODUCT_SPECIAL.TWO_FOR_ONE,
    },
    {
      id: 'p2',
      title: 'Men Sneaker Runner',
      price: 40.99,
      image: '/images/shoe-running.webp',
      description: 'Men Sneakers Summer Mesh Lightweight Shoes Men Fashion Casual Walking Shoes Breathable Slip on Mens Loafers CASUAL SNEAKER',
      special: PRODUCT_SPECIAL.TWO_FOR_ONE,
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
