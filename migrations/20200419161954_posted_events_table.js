
exports.up = function(knex) {
  return knex.raw(`
    CREATE TABLE posted_events (
      eventid int
    );
  `)
};

exports.down = function(knex) {
  
};
