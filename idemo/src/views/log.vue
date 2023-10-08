<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts"></script>
<template>
  <el-timeline>
    <el-timeline-item
      center
      timestamp="2022/4/16"
      placement="top"
      size="large"
      color="#0bbd87"
    >
      <el-card>
        <h1 style="font-size: 18px; font-weight: bold">V1.0</h1>
        <p>
          先部署上线，有地球村的夜晚（含窗帘对比）,WFS服务增删改查演示,雨水分布图。
        </p>
      </el-card>
    </el-timeline-item>
    <el-timeline-item timestamp="2023/3/18" placement="top">
      <el-card>
        <h1 style="font-size: 18px; font-weight: bold">V1.1</h1>
        <p>
          时隔大半年，在捡起来添加点东西吧(该找实习了..)，并对原来的代码重构一下，把之前有些用vue2
          option API的语法改为composition API(script
          setup)写法,在把yarn换为pnpm，把之前的cesiumJS相关的移除了，对首屏加载速度影响较大
        </p>
      </el-card>
    </el-timeline-item>
    <el-timeline-item timestamp="2023/10/8" placement="top">
      <el-card>
        <h1 style="font-size: 18px; font-weight: bold">V1.2</h1>
        <p>
          在实习这段时间抽空陆陆续续添加和很多之前学习和近期学习测试的示例，同时也对整个项目进行了重写，如添加登录功能，将之前的node服务换为了java（springboot），根据进行实习所学习到的知识前端项目代码格式化什么进行配置什么eslint、prettier等
        </p>
      </el-card>
    </el-timeline-item>
    <el-timeline-item timestamp="202x/X/X" placement="top">
      <el-card>
        <h1 style="font-size: 18px; font-weight: bold">V1.3</h1>
        <p></p>
      </el-card>
    </el-timeline-item>
  </el-timeline>
</template>

<style>
ul.el-timeline {
  padding: 50px;
  padding-right: 200px;
  height: 100vh;
  background-color: #f2f2f2;
}
h1 {
  padding-bottom: 12px;
}
</style>
