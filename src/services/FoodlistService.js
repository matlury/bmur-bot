const request = require('request-promise')
const fi = require('date-fns/locale/fi')
const { format } = require('date-fns')
const R = require('ramda')

const restaurants = {
  chemicum: 10,
  exactum: 11,
  porthania: 39,
  yolo: 9,
}

function parseFoodlistData({ data, information }) {
  const now = new Date()
  const unicafeFormat = format(now, 'EEEEEE dd.MM', { locale: fi })
  const foodList = R.pipe(
    R.filter(({ date }) => date.toLowerCase() === unicafeFormat),
    R.chain(({ data }) => data),
    R.map(({ name, price, nutrition, ingredients, meta }) => ({
      name: name,
      price: {
        student: price.value.student,
        graduate: price.value.graduate,
        contract: price.value.contract,
        normal: price.value.normal,
        name: price.name,
      },
      nutrition: nutrition,
      ingredients: ingredients,
      warnings: meta['1'],
    }))
  )(data)
  return {
    restaurantName: information.restaurant,
    foodList,
  }
}

/**
 * Fetches foodlist for restaurant
 * @param {String} restaurant
 * @return {Promise}
 */
function fetchRestaurantFoodlist(restaurant) {
  if (!restaurants[restaurant]) return Promise.reject('No restaurant found')
  return request
    .get('http://messi.hyyravintolat.fi/publicapi/restaurant/' + restaurants[restaurant])
    .then(JSON.parse)
    .then(parseFoodlistData)
}

module.exports = fetchRestaurantFoodlist
