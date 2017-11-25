import axios from "axios";
const HTTP_ERROR = require("./httpError");

function validateStatus(status) {
  return status % 100 === 0;
}

const fetch = axios.create({
  timeout: 5000,
  withCredentials: true
});

fetch.errorNotify = function(error) {
  console.error(error);
};
fetch.start = function() {};
fetch.finish = function() {};
fetch.error = function() {};
fetch.environment = require("../file/env.json");

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
    fetch.end();
    if (validateStatus(response.data.statusCode)) {
      response.data = response.data.data;
      return Promise.resolve(response);
    }
    fetch.errorNotify({
      code: response.data.statusCode,
      message: response.data.message
    });
    return Promise.reject(response);
  },
  error => {
    fetch.error();
    if (error.response) {
      fetch.errorNotify({
        code: error.response.status,
        message: HTTP_ERROR[error.response.status][1]
      });
      console.table(error.response.data);
      return Promise.reject(error.response);
    } else if (error.status) {
      fetch.errorNotify({
        code: error.status,
        message: HTTP_ERROR[error.status][1]
      });
    }
    return Promise.reject(error);
  }
);

module.exports = fetch;
