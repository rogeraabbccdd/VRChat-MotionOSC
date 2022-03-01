import { createApp } from 'vue'
import App from './App.vue'
// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'
// Font awesome icons
import './plugins/fontawesome'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// Style
import './styles/main.sass'

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')
