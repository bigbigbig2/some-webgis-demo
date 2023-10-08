import axios from "axios";
import {ElMessage} from "element-plus";

const authItemName: string = "authorize";

const accessHeader = () => {
  return {
    Authorization: `Bearer ${takeAccessToken()}`
  };
};

const defaultError = error => {
  console.error(error);
  ElMessage("发生了一些错误，请联系管理员");
};

const defaultFailure = (message, status, url) => {
  console.warn(`请求地址: ${url}, 状态码: ${status}, 错误信息: ${message}`);
  ElMessage(message);
};

function takeAccessToken() {
  const str =
    localStorage.getItem(authItemName) || sessionStorage.getItem(authItemName);
  if (!str) return null;
  const authObj = JSON.parse(str);
  if (new Date(authObj.expire) <= new Date()) {
    deleteAccessToken();
    ElMessage("登录状态已过期，请重新登录！");
    return null;
  }
  return authObj.token;
}

function storeAccessToken(remember, token, expire) {
  const authObj = {
    token: token,
    expire: expire
  };
  const str = JSON.stringify(authObj);
  if (remember) localStorage.setItem(authItemName, str);
  else sessionStorage.setItem(authItemName, str);
}

function deleteAccessToken() {
  localStorage.removeItem(authItemName);
  sessionStorage.removeItem(authItemName);
}

function internalPost(
  url,
  data,
  headers,
  success,
  failure,
  error = defaultError
) {
  axios
    .post(url, data, {headers: headers})
    .then(({data}) => {
      if (data.code === 200) success(data.data);
      else failure(data.message, data.code, url);
    })
    .catch(err => error(err));
}

function internalGet(url, headers, success, failure, error = defaultError) {
  axios
    .get(url, {headers: headers})
    .then(({data}) => {
      if (data.code === 200) success(data.data);
      else failure(data.message, data.code, url);
    })
    .catch(err => error(err));
}

function login(
  username,
  password,
  remember,
  success,
  failure = defaultFailure
) {
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  internalPost(
    "http://175.178.49.159:8080/api/auth/login",
    // "http://localhost:8081/api/auth/login",
    // {
    //   username: username,
    //   password: password
    // },
    params,
    {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    data => {
      storeAccessToken(remember, data.token, data.expire);
      ElMessage(`登录成功，欢迎 ${data.username} `);
      success(data);
    },
    failure
  );
}

function post(url, data, success, failure = defaultFailure) {
  internalPost(url, data, accessHeader(), success, failure);
}

function logout(success, failure = defaultFailure) {
  get(
    "http://175.178.49.159:8080/api/auth/logout",
    () => {
      deleteAccessToken();
      ElMessage(`退出登录成功，欢迎您再次使用`);
      success();
    },
    failure
  );
}

function get(url, success, failure = defaultFailure) {
  internalGet(url, accessHeader(), success, failure);
}

function unauthorized() {
  return !takeAccessToken();
}

export {post, get, login, logout, unauthorized};
