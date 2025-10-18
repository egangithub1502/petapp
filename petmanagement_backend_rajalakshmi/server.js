// Test GitHub Actions Workflow 

const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const http = require("http");
const path = require('path');
const requestIp = require('request-ip');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require("express-rate-limit");
//file requirements
const userRoutes = require('./app/routes/sresu.routes.js')
const useragent = require('./app/config/useragent.js')
dotenv.config();
const app = express();

app.use(cors(
  {
    origin: ['http://localhost:4200', 'http://localhost:4200/', 'http://localhost:8080', 'http://localhost:8080/', 'http://localhost:8083', 'http://localhost:8083/'],
    credentials: true,

  }
)
)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "scriptSrc": ["'self'", 'http://localhost:4200', 'http://localhost:4200/', 'http://localhost:8083', 'http://localhost:8083/'],
      "defaultSrc": ["'self'", 'http://localhost:4200', 'http://localhost:4200/', 'http://localhost:8083', 'http://localhost:8083/'],
      "styleSrc": ["'self'", 'http://localhost:4200', 'http://localhost:4200/', 'http://localhost:8083', 'http://localhost:8083/'],
      "fontSrc": ["'self'", 'https', 'data'],

    },
  },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: { policy: "require-corp" },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

}));
app.use(logger('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

app.use((req, res, next) => {
  const userAgent = req.get("User-Agent");
  if (useragent.useragent.includes(userAgent)) {
    res
      .status(403)
      .json({ status: false, message: "Access Denied" });
  } else {
    next();
  }
});

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type,X-Requested-With, Accept,connectioncontrol,post-signature usertoken');
  res.setHeader('Permissions-Policy', 'geolocation=(self "http://localhost:4200/" "http://localhost:4200/" "http://localhost:8083/" "http://localhost:8083/")')
  next();
});
app.use(requestIp.mw());

const limiter = rateLimit({
  windowMs: 1 * 1000, // 1 second
  max: 45, // limit each IP to 20 requests per windowMs
  keyGenerator: (req, res) => {
    return req.clientIp // IP address from requestIp.mw(), as opposed to req.ip
  }
});

//  apply to all requests
app.use(limiter);


// Define the port
const PORT = process.env.PORT;

const dbconfigconnection = require("./app/models/index.js");
dbconfigconnection()


// simple route
app.get("/", (req, res) => {
  res.json({ status: true, message: "Welcome to pet missing report management backend application." });
});

app.use('/uploads', express.static(path.join(__dirname, '/app/routes/uploads')));
app.use('/v1/users', userRoutes)

let server = http.createServer(app);
server.listen(PORT, () => {
  console.log('HTTP Server running on port ' + PORT);
});
module.exports = app;


