// This file helps Netlify understand which dependencies to bundle
// It imports all the dependencies used by the serverless functions

require('express');
require('ejs');
require('path');
require('dotenv');
require('bcryptjs');
require('connect-flash');
require('connect-mongo');
require('express-session');
require('json2csv');
require('method-override');
require('moment');
require('mongoose');
require('passport');
require('passport-local');
require('serverless-http');

// This file doesn't need to do anything, it just needs to import the dependencies
console.log('Dependencies loaded for Netlify bundling');
