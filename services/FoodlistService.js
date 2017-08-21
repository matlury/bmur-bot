const request = require('request');

const restaurants = {
  'chemicum': 10,
  'exactum': 11,
  'porthania': 39,
  'yolo': 9
}

class FoodlistService {
  constructor() { }

  /**
   * Fetches foodlist for restaurant
   * @param {String} restaurant 
   * @return {Promise}
   */
  fetchRestaurantFoodlist(restaurant, cb) {
    if (!restaurants[restaurant])
      return cb(null);
    request.get('http://messi.hyyravintolat.fi/publicapi/restaurant/' + restaurants[restaurant], (err, res, body) => {
      if (err) return cb(null);
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
      cb(list);
    });
  }
}

module.exports = FoodlistService;