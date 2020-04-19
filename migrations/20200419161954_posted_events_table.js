
exports.up = function(knex) {
  return knex.raw(`
    CREATE TABLE posted_events (
      eventId int
    );
  `)
};

exports.down = function(knex) {
  
};
