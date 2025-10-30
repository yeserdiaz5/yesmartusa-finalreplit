export type UserRole = "buyer" | "seller" | "admin"

export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  phone: string | null
  store_name: string | null
  seller_address: {
    full_name: string
    address_line1: string
    address_line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  } | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  seller_id: string
  title: string
  description: string | null
  price: number
  stock_quantity: number
  category: string | null
  image_url: string | null
  images: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface ProductWithRelations extends Product {
  categories?: Category[]
  tags?: Tag[]
  seller?: User
}

export interface Order {
  id: string
  buyer_id: string
  status: OrderStatus
  total_amount: number
  shipping_address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  payment_intent_id: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  seller_id: string
  quantity: number
  price_at_purchase: number
  created_at: string
}

export interface Review {
  id: string
  product_id: string
  buyer_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
}
