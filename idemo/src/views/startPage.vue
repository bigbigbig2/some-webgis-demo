<script setup lang="ts">
// import {ref} from "vue";
import {useRouter} from "vue-router";
const router = useRouter();
// const route = useRoute();
const navigateToPage = page => {
  router.push(`${page}`);
};
// const currentDate = ref(new Date());
</script>

<template>
  <div class="container">
    <el-divider content-position="center">MapboxGL/DeckGL</el-divider>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('grid')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/308842e42a4d4bd5a632e0b96550002d.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">全球网络性能指标动态聚合六边形格网</span>
            <div class="subTxxt">
              <span
                >使用PGSQL/PostGIS+SpringBoot搭建的六边形格网聚合分析的动态矢量切片服务，（性能拉跨，待优化）</span
              >
              <!-- <time class="time">{{ currentDate }}</time> -->
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('buildings')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/8d2889538f824bf4b947261f1f4e500d.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">MVT建筑切片</span>
            <div class="subTxxt">
              <span
                >使用Mapbox+deckgl加载MVT建筑物矢量切片，注入着色器代码修改建筑物样式</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="center">GIS引擎与渲染库整合</el-divider>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('mapboxtwgl')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/17005a4c74ee443f9f3e68af24e6411d.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">Mapbox+twgl</span>
            <div class="subTxxt">
              <span
                >使用Mapbox的customLayer API
                使用同一个gl上下文与twgl（轻量webgl库）整合测试</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('mapboxregl')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/eab5e98d6778482aae2c1c3c866cf5f2.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">Mapbox+webgl2</span>
            <div class="subTxxt">
              <span
                >使用Mapbox的customLayer API +webgl2
                绘制带高度的线条整合测试</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('mapboxregl')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/eab5e98d6778482aae2c1c3c866cf5f2.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">Mapbox+regl</span>
            <div class="subTxxt">
              <span
                >使用Mapbox的customLayer API
                使用同一个gl上下文与twgl（轻量webgl库）整合测试</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('cesiumthree')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img src="/home/cesiumthree.jpg" class="image" />
          <div style="padding: 14px">
            <span class="title">cesium+threejs</span>
            <div class="subTxxt">
              <span
                >两个canva方案,每帧同步threejs相机fov至cesium相机fov、模型矩阵等，同步渲染帧</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('cesiumdeck')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/926e1bffa5014dbd8018f1abe9c0d4bc.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">cesium+deckgl</span>
            <div class="subTxxt">
              <span
                >也是两个canva、两个webgl上下文方案,将deckgl的globeView的layer叠加到cesium上，但对于每帧同步相机等还未实现，因为deckGL的球参数与cesium不一样，这块不好弄，有空继续研究下,如果实现了就可以在cesium使用deckgl那一套layer了</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="center">Threejs</el-divider>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('lightShadow')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/ec53bac0d17d4ab3ab12da639404601b.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">光照与阴影</span>
            <div class="subTxxt">
              <span>点光源、聚光灯、平行光及其阴影投射测试</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('particlesAnimate')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img src="/home/particlesAnimate.jpg" class="image" />
          <div style="padding: 14px">
            <span class="title">粒子动画</span>
            <div class="subTxxt">
              <span
                >通过数学函数构造粒子波浪，直接在渲染循环函数中修改粒子position属性生成</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('particlesGalaxy')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/4b36096f21aa46c9ae3fa0dc9dc61d80.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">粒子银河动画</span>
            <div class="subTxxt">
              <span>使用着色器实现粒子银河动画</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('particlesMap')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/a9bba09dcccd4e919b938e09ee6c88b2.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">粒子星空效果</span>
            <div class="subTxxt">
              <span>给粒子设定贴图、放大粒子系统随机生成星空效果</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('rawShaderMaterial')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/46980a3bb7a8434f9279038b4cfed3ef.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">原始着色器材质</span>
            <div class="subTxxt">
              <span>RawShaderMaterial原始着色器材质实现动画随机效果</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('realisticRender')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/f355956c0a774debb23613cbcf1a5bf5.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">环境映射与色调</span>
            <div class="subTxxt">
              <span>环境映射与色调调节效果学习</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('modifiedMaterials')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/60ef1aeb889147a690552594fc3ec2d7.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">修改内置着色器的材质</span>
            <div class="subTxxt">
              <span
                >修改MeshStandardMaterial着色器代码，相比于使用原始着色其材质此方式可能更适用</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('physicsEngine')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img src="/home/physicsEngine.jpg" class="image" />
          <div style="padding: 14px">
            <span class="title">物理模拟</span>
            <div class="subTxxt">
              <span>使用cannon库+three.js实现基础的物理掉落与反弹效果</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="center">cesium</el-divider>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('cesiumNumCity')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/eb9394fb2a6244f292b4b5a06f8e6139.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">cesium夜幕之城</span>
            <div class="subTxxt">
              <span
                >使用cityEntity+cesiumLab处理模型，使用cesium加载并设定自定义天空盒效果等</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="center">Openlayers/OGC服务</el-divider>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('night')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/8a8c5510b65b4ab3958b1b1e32d0faa2.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">地球村的夜晚（WMTS）</span>
            <div class="subTxxt">
              <span
                >2012-2016的夜光遥感卷帘对比图，使用geoserv
                er发布为WMTS服务</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('rain')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/1fba94a2c14947589978ed72f05165cd.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">实时24/48/72小时降雨分布图</span>
            <div class="subTxxt">
              <span
                >调用浙江水利官网的降雨数据开发接口+openlayers实现降雨分布图效果</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('queryWFS')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/a3a0459539b040ce9e8052b56839292c.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">WFS查询要素</span>
            <div class="subTxxt">
              <span
                >使用geoserver发布WFS服务，使用openlayers调用服务查询要素</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('operateWFS')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/82c96e7df42c425bb71efba5b441fbba.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">WFS修改要素</span>
            <div class="subTxxt">
              <span
                >使用geoserver发布WFS服务，使用openlayers调用服务修改要素并保存推送</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('deleteWFS')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/47d0702be3b84f38b5c119d1f7053ebc.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">WFS删除选中要素</span>
            <div class="subTxxt">
              <span
                >使用geoserver发布WFS服务，使用openlayers调用服务删除要素并保存推送</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="center">WebGL/其他</el-divider>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('phong')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/a3ce9801edcc4ede9935c29c4c577d7c.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">phong着色模型</span>
            <div class="subTxxt">
              <span>使用webgl（OGL）着色器实现基础phong着色模型</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('triangulation')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/e089daee83ad4fa092cf91c90c7a719a.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">三角剖分</span>
            <div class="subTxxt">
              <span>webgl使用earcut三角剖分库生成顶点索引绘制多边形</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('InTriangle')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/c5134987ce9e4f04a8f31687c48a901d.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">判断点是否位于多边形内</span>
            <div class="subTxxt">
              <span>webgl判断点是否位于多边形内</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="5" :offset="1">
        <el-card
          @click="navigateToPage('cubeTexture')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/190e4210c60b41499fdfa27feba42fd4.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">鼠标拖动旋转与立方体贴图</span>
            <div class="subTxxt">
              <span>webgl使用鼠标拖动旋转于立方体贴图测试</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5" :offset="0">
        <el-card
          @click="navigateToPage('wind')"
          class="card"
          shadow="hover"
          :body-style="{padding: '0px'}"
        >
          <img
            src="https://img-blog.csdnimg.cn/106e9d74e5524fab845bc491c660ac4f.jpeg"
            class="image"
          />
          <div style="padding: 14px">
            <span class="title">webgl全球风场</span>
            <div class="subTxxt">
              <span
                >改于mapbox大佬的开源项目，对于webgl学习深入很有学习意义（todo：使用regl重写并与mapbox整合）</span
              >
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss">
.container {
  background: #ececec; // 滑块颜色
  padding: 30px;
  overflow-x: hidden;
  padding-left: 80px;
  .row {
    margin-top: 30px;
  }
}

.time {
  font-size: 12px;
  color: #999;
}

.subTxxt {
  margin: 5px 0;
  font-size: 10px;
}
.card {
  cursor: pointer;
}

.image {
  width: 100%;
  height: 100%;
  display: block;
}
.title {
  font-size: 14px;
  font-weight: bold;
}
</style>
