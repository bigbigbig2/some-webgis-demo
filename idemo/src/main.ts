import {createApp} from "vue";
import "./style.css";
import router from "./router";
import App from "./App.vue";
import {createPinia} from "pinia";
// import axios from "axios";

const pinia = createPinia();
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}

// axios.defaults.baseURL = "http://localhost:8080";

createApp(App).use(router).use(pinia).mount("#app");
