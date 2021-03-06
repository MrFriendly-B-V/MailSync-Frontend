import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import { getScopes, IUser, logIn } from './login'
import 'material-design-icons-iconfont/dist/material-design-icons.css'

Vue.config.productionTip = false

export const MAILSYNC_SERVER = process.env.NODE_ENV === 'production' ? "/api/v1" : "http://localhost:8080/api/v1"

interface AppData {
	user: 	IUser,
}

new Vue({
	router,
	store,
	vuetify,
	data(): AppData {
		return {
			user: null as any,
		}
	},
	created() {
		if(!window.location.hash.substr(1).startsWith("/login")) {
			logIn().then(r => {
				this.user = r
			})
		}
	},
	render: h => h(App)
}).$mount('#app')