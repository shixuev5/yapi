const yapi = require("../yapi.js");
const baseController = require("./base.js");
const interfaceModel = require("../models/interface");
const projectModel = require("../models/project");
const util = require("util");
let exec = require("child_process").exec;
exec = util.promisify(exec);

class apiController extends baseController {
  constructor(ctx) {
    super(ctx);
    this.interfaceModel = yapi.getInst(interfaceModel);
    this.projectModel = yapi.getInst(projectModel);
  }

  async index(ctx) {
    const { project_id } = ctx.request.body;
    const interList = await this.interfaceModel.getByPid(project_id);
    const projList = await this.projectModel.getByPid(project_id);
    const obj = {};
    projList.forEach(item => obj[item._id] = item.name);
    const request = [];
    interList.forEach(item => {
      const {env, path, method, req_params, req_headers, req_query} = item;
      request.push({
        env, 
        path, 
        method, 
        req_params,
        req_headers, 
        req_query, 
        title: item.title.split('|')[0], 
        project_name: obj[item.project_id]
      });
    })
    await yapi.fs.writeFile(
      yapi.path.resolve(yapi.WEBROOT, "./api/file/request.json"),
      JSON.stringify(request, null, 2)
    );
    await yapi.fs.writeFile(
      yapi.path.resolve(yapi.WEBROOT, "./api/file/env.json"),
      JSON.stringify(convert2env(projList), null, 2)
    );
    await exec("npm run package:api");
    this.download(ctx);
  }

  async download(ctx) {
    ctx.body = {
      statusCode: 200,
      message: "成功",
      data: {
        url: ctx.request.origin + "/attachment/api.js"
      }
    };
  }
}

// 合并环境变量
function convert2env(proj) {
  const obj = {};
  proj.forEach(i => {
    i.env.forEach(m => {
      obj[m.name] = m.domain;
    });
  });
  return obj;
}

module.exports = apiController;
