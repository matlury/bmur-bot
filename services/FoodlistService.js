const request = require('request-promise');

const restaurants = {
  'chemicum': 10,
  'exactum': 11,
  'porthania': 39,
  'yolo': 9
}


function parseFoodlistData(body) {
  let parsedResult = JSON.parse(body);
  let list = [];
  var now = new Date();
  var d = now.getDate() < 10 ? '0' + now.getDate() : '' + now.getDate();
  d += '.';
  d += (now.getMonth() + 1) < 10 ? '0' + (now.getMonth() + 1) : '' + (now.getMonth() + 1);
  var res = {};

  for (var i of parsedResult.data) {
    if (i.date.split(' ')[1] === d) {
      for (var i of i.data) {
        var o = {
          name: i.name,
          price: {
            student: i.price.value.student,
            graduate: i.price.value.graduate,
            contract: i.price.value.contract,
            normal: i.price.value.normal,
            name: i.price.name
          },
          nutrition: i.nutrition,
          ingredients: i.ingredients,
          warnings: i.meta["1"]
        }

        if (o.name.toLowerCase().indexOf('pizza') > -1 && o.warnings.indexOf('rippemahdollisuus') === -1) o.warnings.push('rippemahdollisuus');

        list.push(o);

      }
    }
  }
  list.restaurantName = parsedResult.information.restaurant;
  return list
}

/**
 * Fetches foodlist for restaurant
 * @param {String} restaurant 
 * @return {Promise}
 */
function fetchRestaurantFoodlist(restaurant) {
  if (!restaurants[restaurant])
    return Promise.reject('No restaurant found')
  return request.get('http://messi.hyyravintolat.fi/publicapi/restaurant/' + restaurants[restaurant])
    .then(parseFoodlistData)
}

module.exports = fetchRestaurantFoodlist;