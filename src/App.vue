<template>
	<v-app>
		<v-app-bar
			app
			color="secondary"
			dark>

			<div class="d-flex align-center">
			<v-img
				alt="MrFriendly logo"
				class="shrink mr-2 hover-pointer"
				contain
				src="@/assets/logo.png"
				transition="scale-transition"
				width="70"
				@click="redirectToMrfriendly"></v-img>
			</div>

			<v-spacer></v-spacer>
			<v-btn
				icon
				v-if="this.isAdmin"
				@click="redirectToSettings()">

				<v-icon>mdi-cog</v-icon>
			</v-btn>
		</v-app-bar>

		<v-main>
			<router-view/>
		</v-main>
	</v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { getScopes } from './login';

interface ComponentData {
	isAdmin:	boolean
}

export default Vue.extend({
	data(): ComponentData {
		return {
			isAdmin: false
		}
	},
	mounted: async function () {
		while(this.$root.$data.user == null) {
			await new Promise(t => setTimeout(t, 20))
		}

		getScopes(this.$root.$data.user)
		.then(r => {
			if(r != null) {
				this.isAdmin = r.includes('mrfriendly.mailsync.admin')
			}
		})
	},
	methods: {
		redirectToMrfriendly() {
			window.location.href = 'https://mrfriendly.nl'
		},
		redirectToSettings() {
			if(this.$router.currentRoute.name != 'settings') {
				this.$router.push({name: 'settings'})
			}
		}
	}
});
</script>

<style lang="scss">
.hover-pointer:hover {
	cursor: pointer;
}
</style>