<script setup>
import {User, Lock} from "@element-plus/icons-vue";
import router from "@/router";
import {reactive, ref} from "vue";
import {login} from "@/utils/request";

const formRef = ref();
const form = reactive({
  username: "test",
  password: "123456",
  remember: false
});

const rules = {
  username: [{required: true, message: "请输入用户名"}],
  password: [{required: true, message: "请输入密码"}]
};

function userLogin() {
  formRef.value.validate(isValid => {
    if (isValid) {
      login(form.username, form.password, form.remember, () => {
        router.push("/startPage");
      });
    }
  });
}
</script>
<template>
  <div style="text-align: center; margin: 0 20px">
    <div style="margin-top: 150px">
      <div style="font-size: 25px; font-weight: bold">登录</div>
    </div>
    <div style="margin-top: 50px">
      <el-form :model="form" :rules="rules" ref="formRef">
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            maxlength="10"
            type="text"
            placeholder="用户名/邮箱"
            :prefix-icon="User"
          >
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            maxlength="20"
            style="margin-top: 10px"
            placeholder="密码"
            :prefix-icon="Lock"
          >
          </el-input>
        </el-form-item>
        <el-row style="margin-top: 5px">
          <el-col :span="12" style="text-align: left">
            <el-form-item prop="remember">
              <el-checkbox v-model="form.remember" label="记住我" />
            </el-form-item>
          </el-col>
          <el-col :span="12" style="text-align: right">
            <el-link @click="router.push('/forget')">忘记密码？</el-link>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <div style="margin-top: 40px">
      <el-button @click="userLogin()" style="width: 270px">立即登录</el-button>
    </div>
    <el-divider>
      <span style="color: grey; font-size: 13px">没有账号</span>
    </el-divider>
    <div>
      <el-button style="width: 270px" @click="router.push('/register')"
        >注册账号</el-button
      >
    </div>
  </div>
</template>
<style scoped></style>
