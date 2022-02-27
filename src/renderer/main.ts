import { createApp } from 'vue'
import App from './App.vue'
// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'
// Font awesome icons
import './plugins/fontawesome'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// Style
import './styles/main.sass'

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')
