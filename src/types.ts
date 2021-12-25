export interface Value {
  student: string
  graduate_hyy: string
  student_hyy: string
  contract: string
  normal: string
  graduate: string
}

export interface Price {
  value: Value
  name: string
}

export interface Meta {
  0: string[]
  1: string[]
  2: string[]
}

export interface Datum2 {
  price: Price
  sku: string
  ingredients: string
  name_sv: string
  name_en: string
  meta: Meta
  name: string
  nutrition: string
}

export interface Datum {
  date: string
  data: Datum2[]
  date_en: string
  date_sv: string
  message?: any
}

export interface Regular {
  close: string
  open: string
  when: any[]
}

export interface Exception {
  close: string
  closed: boolean
  open: string
  to: string
  from: string
}

export interface Lounas {
  regular: Regular[]
  exception: Exception[]
}

export interface Exception2 {
  close?: any
  closed: boolean
  to?: any
  open?: any
  from?: any
}

export interface Regular2 {
  open: string
  when: boolean[]
  close: string
}

export interface Breakfast {
  exception: Exception2[]
  name: string
  regular: Regular2[]
}

export interface Exception3 {
  close: string
  from: string
  to: string
  open: string
  closed: boolean
}

export interface Regular3 {
  when: any[]
  open: string
  close: string
}

export interface Business {
  exception: Exception3[]
  regular: Regular3[]
}

export interface Exception4 {
  closed: boolean
  from: string
  open: string
  to: string
  close: string
}

export interface Regular4 {
  close: string
  when: boolean[]
  open: string
}

export interface Bistro {
  name: string
  exception: Exception4[]
  regular: Regular4[]
}

export interface Information {
  zip: string
  hide_prices: number
  phone: string
  restaurant: string
  lounas: Lounas
  address: string
  breakfast: Breakfast
  business: Business
  description_sv: string
  description_en: string
  ilta?: any
  city: string
  email: string
  feedback_address: string
  description: string
  bistro: Bistro
}

export interface LunchMenu {
  status: string
  data: Datum[]
  information: Information
}

export interface FoodList {
  name: string
  price: {
    student: string
    graduate: string
    contract: string
    normal: string
    name: string
  }
  nutrition: string
  ingredients: string
  warnings: string[]
}

export type JobMode = 'postFood' | 'todaysEvents' | 'pollEvents'

export interface EventObject {
  id: number
  starts: string
  name: string
  association: string
  closed: boolean
}
