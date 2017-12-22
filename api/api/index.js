const fetch = require("../fetch");
const reqJSON = require("../file/request.json");

const methods = ["PUT", "POST", "PATCH"];
const mode = ["file", "form"];

// 请求函数构造函数
function fnFactory(req) {
  return function fn(obj = {}, data = {}, config) {
    const reqConfig = Object.assign(
      {},
      {
        method: req.method,
        url: fetch.environment[req.env] + req.path,
        headers: arr2obj(req.req_headers)
      },
      config == null ? data : config
    );

    // 处理:id等restful参数
    if (req.req_params.length) {
      const result = [];
      req.req_params.forEach(val => {
        if (val.name in obj) {
          reqConfig.url = reqConfig.url.replace(new RegExp(`:${val.name}`), obj[val.name]);
          delete obj[val.name];
        } else {
          result.push({
            code: "字段缺失",
            field: val.name,
            message: "必传项"
          });
        }
      });
      if (result.length) {
        return console.table(result);
      }
    }

    // 如果body为File或FormData那么接受的第二个参数data为作为data传递，第一个参数为params
    if (mode.indexOf(req.req_body_type) > 0) {
      reqConfig.data = data;
      reqConfig.params = obj;
    }

    if (methods.indexOf(req.method) > 0) {
      // 如果put、post、patch等方法中包含params，则从obj中分离出params和data，否则直接将obj作为data
      if (req.req_query.length) {
        const { objData, objParams } = splitObj(obj, req.req_query);
        reqConfig.data = objData;
        reqConfig.params = objParams;
      } else {
        reqConfig.data = obj;
      }
    } else {
      reqConfig.params = obj;
    }

    return fetch(reqConfig);
  };
}

// 导出请求函数
function exportReqFn(reqList) {
  const obj = {};
  reqList.forEach(req => {
    if(!obj[req.project_name]) {
      obj[req.project_name] = {};
    }
    obj[req.project_name][req.title] = fnFactory(req);
  });
  return obj;
}

// 将数组转换为obj返回
function arr2obj(arr) {
  const obj = {};
  arr.forEach(val => {
    if (val.required === "1") {
      obj[val.name] = val.value;
    }
  });
  return obj;
}

// 根据定义的请求参数，从传递过来的obj中分离params和data
function splitObj(obj, query) {
  const params = {};
  const data = {};
  query.forEach(item => {
    if (obj[item.name]) {
      params[item.name] = obj[item.name];
    } else {
      data[item.name] = obj[item.name];
    }
  });
  return {
    params,
    data
  };
}

module.exports = exportReqFn(reqJSON);
