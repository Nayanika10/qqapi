'use strict';

// Test specific configuration
// ===========================
module.exports = {
  // MongoDB connection options
  quarc: {
    username: process.env.QUARC_MYSQL_USER,
    password: process.env.QUARC_MYSQL_PASS,
    database: process.env.QUARC_MYSQL_DB,
    host: process.env.QUARC_MYSQL_HOST,
    dialect: 'mysql',
    logging: false,
    timezone: '+05:30',
  },
  quantum: {
    username: process.env.QUANTUM_MYSQL_USER,
    password: process.env.QUANTUM_MYSQL_PASS,
    database: process.env.QUANTUM_MYSQL_DB,
    host: process.env.QUANTUM_MYSQL_HOST,
    dialect: 'mysql',
    logging: true,
    timezone: '+05:30',
  },
  solr: {
    host: process.env.SOLR_HOST,
    port: process.env.SOLR_PORT,
    core: process.env.SOLR_CORE,
    path: process.env.SOLR_PATH,
  },

};
