const axios = require("axios");
const HTTP_ERROR = require("./httpError.js");

function validateStatus(status) {
  return status % 100 === 0;
}

const fetch = axios.create({
  timeout: 5000
});

fetch.errorNotify = function(error) {
  console.table(error);
};
fetch.start = function(config) {
  return config;
};
fetch.success = function() {};
fetch.error = function() {};
fetch.validate = function(data) {
  return !!data.totalFeatures;
}
fetch.environment = require("../file/env.json");

function errorHandle(error) {
  fetch.error();
  if (error.status) {
    fetch.errorNotify({
      code: error.status,
      message: HTTP_ERROR[error.status][1]
    });
  } else {
    fetch.errorNotify({
      code: error.code,
      message: error.message
    });
  }
  return Promise.reject(error);
}

fetch.interceptors.request.use(
  config => fetch.start(config),
  error => {
    fetch.error();
    if (error.request) {
      fetch.errorNotify({
        code: error.request.status,
        message: HTTP_ERROR[error.request.status][1]
      });
    } else {
      fetch.errorNotify({
        code: error.status,
        message: HTTP_ERROR[error.status][1]
      });
    }
  }
);

fetch.interceptors.response.use(
  response => {
    if (
      response.data.statusCode && validateStatus(response.data.statusCode) ||
      !response.data.statusCode && fetch.validate(response.data)
    ) {
      fetch.success();
      if (response.data.data) {
        response.data = response.data.data;
      }
      return Promise.resolve(response);
    }
    fetch.error();
    fetch.errorNotify({
      code: response.data.statusCode,
      message: response.data.message
    });
    return Promise.reject(response);
  },
  error => {
    const config = error.config;
    if (!config || !config.retry) return errorHandle(error);

    config.__retryCount = config.__retryCount || 0;

    if (config.__retryCount >= config.retry) {
      return errorHandle(error);
    }

    config.__retryCount += 1;

    return new Promise(resolve => {
      setTimeout(function() {
        resolve();
      }, config.retryDelay || 1);
    }).then(() => fetch(config));
  }
);

module.exports = fetch;
