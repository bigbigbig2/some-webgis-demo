<!-- eslint-disable vue/multi-word-component-names -->
<script>
export default {
  name: "home",
  data() {
    return {
      activeMenu: location.hash.slice(1) //获取当前页面url地址来渲染到到当前点击的menu
    };
  },
  methods: {
    toStartPage() {
      this.$router.push("/startPage");
    }
  }
};
</script>

<template>
  <div class="basic-layout">
    <!-- 左边导航菜单 -->
    <div class="nav-side">
      <div class="title" @click="toStartPage" style="cursor: pointer">
        <p class="context">idemo</p>
      </div>
      <el-menu :default-active="activeMenu" router class="nav-menu">
        <el-sub-menu index="1">
          <template #title>
            <!-- <el-icon ><moon-night  style="font-size:22px" /></el-icon> -->
            <span>mapboxgl/deckgl</span>
          </template>
          <el-menu-item index="grid">动态格网统计分析</el-menu-item>
          <el-menu-item index="buildings">MVT-Buildings</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2">
          <template #title>
            <span>WFS服务</span>
          </template>
          <el-menu-item index="queryWFS">通过WFS查询要素</el-menu-item>
          <el-menu-item index="operateWFS">通过WFS修改要素</el-menu-item>
          <el-menu-item index="deleteWFS">通过WFS删除要素</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="3">
          <template #title>
            <span>openlayers</span>
          </template>
          <el-menu-item index="night">地球村的夜晚</el-menu-item>
          <el-menu-item index="rain">雨水分布图</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="4">
          <template #title>
            <span>实时渲染</span>
          </template>
          <el-menu-item index="phong">phong着色模型</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="5">
          <template #title>
            <span>Cesium</span>
          </template>
          <el-menu-item index="cesiumNumCity">夜幕之城</el-menu-item>
          <el-menu-item index="cesiumRealScene">实景三维场景</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="6">
          <template #title>
            <span>ThreeJS</span>
          </template>
          <el-menu-item index="lightShadow">光照与阴影</el-menu-item>
          <el-menu-item index="particlesMap">粒子星空</el-menu-item>
          <el-menu-item index="particlesAnimate">粒子动画</el-menu-item>
          <el-menu-item index="particlesGalaxy">银河动画</el-menu-item>
          <el-menu-item index="physicsEngine">物理模拟</el-menu-item>
          <el-menu-item index="realisticRender">环境映射与色调</el-menu-item>
          <el-menu-item index="rawShaderMaterial">原始着色器材质</el-menu-item>
          <el-menu-item index="modifiedMaterials"
            >修改内置着色器材质</el-menu-item
          >
        </el-sub-menu>
        <el-sub-menu index="7">
          <template #title>
            <span>三维引擎整合</span>
          </template>
          <el-menu-item index="cesiumthree">cesium与three</el-menu-item>
          <el-menu-item index="cesiumdeck">cesium与deckgl</el-menu-item>
          <el-menu-item index="mapboxwebgl2">mapbox与webgl2</el-menu-item>
          <el-menu-item index="mapboxregl">mapbox与regl</el-menu-item>
          <el-menu-item index="mapboxtwgl">mapbox与twgl</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="8">
          <template #title>
            <span>WebGL</span>
          </template>
          <el-menu-item index="triangulation">三角剖分</el-menu-item>
          <el-menu-item index="InTriangle">判断点是否在多边形内</el-menu-item>
          <el-menu-item index="cubeTexture">拖动旋转与简单贴图</el-menu-item>
          <el-menu-item index="wind">全球风场</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="9">
          <template #title>
            <span>关于</span>
          </template>
          <el-menu-item index="arc">网站架构</el-menu-item>
          <el-menu-item index="log">更新日志</el-menu-item>
          <a
            style="color: #fff"
            href="https://www.luxd.space/about/"
            target="_blank"
            ><el-menu-item click="toAbout">关于我</el-menu-item></a
          >
        </el-sub-menu>
      </el-menu>
    </div>
    <!-- 右边内容块 -->
    <div class="content-right">
      <div class="wrapper">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.basic-layout {
  position: relative;
  .nav-side {
    position: fixed;
    width: 200px;
    height: 100vh;
    background-color: #ffffff;
    color: #fff;
    overflow-y: auto; //设置滚动条
    overflow-x: hidden;
    .title {
      height: 50px;
      display: -webkit-box;
      -webkit-box-align: center; /* 垂直居中 */
      -webkit-box-pack: center; /* 水平居中 */
      color: #000000;
      .context {
        font-family: "微软雅黑";
        font-weight: bold;
      }
    }
    .nav-menu {
      border-right: none;
      .el-menu-item {
        height: 38px;
      }
    }
  }
  /*滚动条美化*/
  .nav-side::-webkit-scrollbar {
    width: 8px;
  }
  .nav-side::-webkit-scrollbar-thumb {
    background: #ccc; // 滑块颜色
    border-radius: 5px; // 滑块圆角
  }

  .content-right {
    margin-left: 200px; //左侧固定，右侧自适应
    height: 100vh;
    overflow-y: auto; //设置滚动条
    overflow-x: hidden;
    .wrapper {
      background: #eef0f3;
      height: 100%;
    }
  }

  /*滚动条美化*/
  .content-right::-webkit-scrollbar {
    width: 8px;
  }
  .content-right::-webkit-scrollbar-thumb {
    background: #ccc; // 滑块颜色
    border-radius: 5px; // 滑块圆角
  }
}
</style>
