import React, { PureComponent as Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Row, Col, Button, Tooltip, message, Modal } from "antd";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  addProject,
  fetchProjectList,
  delProject,
  changeUpdateModal
} from "../../../reducer/modules/project";
import ProjectCard from "../../../components/ProjectCard/ProjectCard.js";
import ErrMsg from "../../../components/ErrMsg/ErrMsg.js";
import { autobind } from "core-decorators";
import { setBreadcrumb } from "../../../reducer/modules/user";

import "./ProjectList.scss";

@connect(
  state => {
    return {
      projectList: state.project.projectList,
      userInfo: state.project.userInfo,
      tableLoading: state.project.tableLoading,
      currGroup: state.group.currGroup,
      currPage: state.project.currPage
    };
  },
  {
    fetchProjectList,
    addProject,
    delProject,
    changeUpdateModal,
    setBreadcrumb
  }
)
class ProjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      protocol: "http://",
      projectData: [],
      exportProjectId: [],
      confirm: false,
      loading: false
    };
  }
  static propTypes = {
    form: PropTypes.object,
    fetchProjectList: PropTypes.func,
    addProject: PropTypes.func,
    delProject: PropTypes.func,
    changeUpdateModal: PropTypes.func,
    projectList: PropTypes.array,
    userInfo: PropTypes.object,
    tableLoading: PropTypes.bool,
    currGroup: PropTypes.object,
    setBreadcrumb: PropTypes.func,
    currPage: PropTypes.number,
    studyTip: PropTypes.number,
    study: PropTypes.bool
  };

  // 取消修改
  @autobind
  handleCancel() {
    this.props.form.resetFields();
    this.setState({
      visible: false
    });
  }

  // 修改线上域名的协议类型 (http/https)
  @autobind
  protocolChange(value) {
    this.setState({
      protocol: value
    });
  }

  // 获取 ProjectCard 组件的关注事件回调，收到后更新数据
  @autobind
  receiveRes() {
    this.props.fetchProjectList(this.props.currGroup._id, this.props.currPage);
  }

  //projectCard选择触发的回调函数
  @autobind
  checked(project_id) {
    this.setState(prevState => {
      const arr = [...prevState.exportProjectId];
      const index = arr.indexOf(project_id);
      if (index !== -1) {
        arr.splice(index, 1);
      } else {
        arr.push(project_id);
      }
      return { exportProjectId: arr };
    });
  }

  @autobind
  confirm() {
    this.setState({
      confirm: true
    });
  }

  @autobind
  download() {
    if (this.state.exportProjectId.length) {
      this.setState({
        loading: true
      });
      axios
        .post("/api/api/package", {
          project_id: this.state.exportProjectId
        })
        .catch(() => {
          message.error("接口打包失败！");
        })
        .then(response => {
          Modal.success({
            title: "接口引入方式",
            content: (
              <div>
                <p>
                  第一种： 在项目的index.html入口通过script标签引入, 地址：<code>{response.data.data.url}</code>
                </p>
                <br />
                <p>
                  第二种，点击链接<a
                    href={response.data.data.url}
                    download="api"
                    target="_blank"
                  >
                    下载
                  </a>保存到本地.
                </p>
              </div>
            )
          });
          this.setState({
            confirm: false,
            loading: false
          });
        });
    } else {
      message.error("请选择至少一个项目！");
    }
  }

  componentWillReceiveProps(nextProps) {
    this.props.setBreadcrumb([
      { name: "" + (nextProps.currGroup.group_name || "") }
    ]);

    // 切换分组
    if (this.props.currGroup !== nextProps.currGroup) {
      if (nextProps.currGroup._id) {
        this.props.fetchProjectList(
          nextProps.currGroup._id,
          this.props.currPage
        );
      }
    }

    // 切换项目列表
    if (this.props.projectList !== nextProps.projectList) {
      // console.log(nextProps.projectList);
      const data = nextProps.projectList.map((item, index) => {
        item.key = index;
        return item;
      });
      this.setState({
        projectData: data
      });
    }
  }

  render() {
    let projectData = this.state.projectData;
    let noFollow = [];
    let followProject = [];
    for (var i in projectData) {
      if (projectData[i].follow) {
        followProject.push(projectData[i]);
      } else {
        noFollow.push(projectData[i]);
      }
    }
    followProject = followProject.sort((a, b) => {
      return b.up_time - a.up_time;
    });
    noFollow = noFollow.sort((a, b) => {
      return b.up_time - a.up_time;
    });
    projectData = [...followProject, ...noFollow];
    return (
      <div
        style={{ paddingTop: "24px" }}
        className="m-panel card-panel card-panel-s project-list"
      >
        <Row className="project-list-header">
          <Col span={16} style={{ textAlign: "left" }}>
            {this.props.currGroup.group_name} 分组共 ({projectData.length}) 个项目
          </Col>
          <Col span={8}>
            {/(admin)|(owner)|(dev)/.test(this.props.currGroup.role) ? (
              <Button.Group>
                <Link to="/add-project">
                  <Button type="primary">添加项目</Button>
                </Link>
                {this.state.confirm ? (
                  <Button
                    icon="check"
                    style={{ marginLeft: "20px" }}
                    onClick={this.download}
                    loading={this.state.loading}
                  >
                    {this.state.loading ? "打包中" : "确认"}
                  </Button>
                ) : (
                  <Button
                    icon="download"
                    style={{ marginLeft: "20px" }}
                    onClick={this.confirm}
                  >
                    项目打包
                  </Button>
                )}
              </Button.Group>
            ) : (
              <Tooltip title="您没有权限,请联系该分组组长或管理员">
                <Button type="primary" disabled>
                  添加项目
                </Button>
                <Button disabled style={{ marginLeft: "20px" }}>
                  项目打包
                </Button>
              </Tooltip>
            )}
          </Col>
        </Row>
        <Row gutter={16}>
          {projectData.length ? (
            projectData.map((item, index) => {
              const checked = this.state.exportProjectId.includes(item._id);
              return (
                <Col xs={8} md={6} xl={4} key={index}>
                  <ProjectCard
                    chooseState={this.state.confirm}
                    checked={checked}
                    projectData={item}
                    callbackResult={this.receiveRes}
                    callbackChecked={this.checked}
                  />
                </Col>
              );
            })
          ) : (
            <ErrMsg type="noProject" />
          )}
        </Row>
      </div>
    );
  }
}

export default ProjectList;
