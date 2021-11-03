<template>
    <div>
        <v-snackbar v-model="snackbar">
            {{snackbarText}}
            <template v-slot:action="{ attrs }">
                <v-btn
                    color="primary"
                    text
                    v-bind="attrs"
                    @click="snackbar = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </template>
        </v-snackbar>

        <v-container>
            <v-card
                v-if="isAdmin"
                class="mx-auto mt-6"
                elevation="2">
            
                <v-card-title class="headline">
                        <v-btn 
                            fab
                            small
                            class="mr-3"
                            @click="previousRoute()">
                            <v-icon>mdi-arrow-left</v-icon>
                        </v-btn>
                        Administrative settings
                    </v-card-title>
                <v-container>
                    <v-form
                        v-model="formValid"
                        ref="form">
                        <v-simple-table
                            dense>
                            <tr class="text-left">
                                <th> Property </th>
                                <th> Value </th>
                            </tr>
                            <tr v-for="setting in settings" :key="setting.name">
                                <td>
                                    <div> {{ setting.name }} </div>
                                </td>
                                <td>
                                <v-text-field
                                    v-model="setting.value"
                                    :label="setting.name"
                                    :rules="rules[setting.rule_type]"
                                    required></v-text-field>
                                </td>
                            </tr>
                        </v-simple-table>
                        <v-btn 
                            @click="saveSettings"
                            fab
                            small>
                            <v-icon
                                color="primary">
                                mdi-content-save
                            </v-icon>
                        </v-btn> 
                    </v-form>
                </v-container>
                <v-overlay 
                    :value="loading"
                    absolute
                    z-index="10"
                    opacity="0">
                    <v-progress-circular
                        indeterminate
                        color="primary"
                        size="64"
                    ></v-progress-circular>
                </v-overlay>
            </v-card>
            <v-card 
                v-if="!isAdmin"
                elevation="2"
                class="mx-auto mt-6"
                max-width="344"
                outlined>
                <v-card-title> Unauthorized </v-card-title>
                <v-card-text> Unfortunately, you're not authorized to view this page. </v-card-text>
                <v-card-actions>
                    <div class="text-center">
                        <v-btn floating primary @click="returnToDashboard()" color="primary"> Return to Dashboard </v-btn>
                    </div>
                </v-card-actions>
            </v-card>
            <v-overlay
                :value="loading"
            ></v-overlay>
        </v-container>
    </div>
</template>

<script lang="ts">
import { getCookie, getScopes } from '@/login'
import { MAILSYNC_SERVER } from '@/main'
import Vue from 'vue'

interface ComponentData {
    isAdmin:    boolean
    loading:    boolean
    snackbar:      boolean
    snackbarText:  string
    formValid:  boolean
    settings:   Setting[]
    rules:      Rules 
}

interface Rules {
    url: { (input: string ): string | boolean; }[]
}

interface Setting {
    name:       string,
    value:      string
    rule_type:  string
}

export default Vue.extend({
    data(): ComponentData {
        return {
            isAdmin: false,
            loading: true,
            snackbar: false,
            snackbarText: null as any,
            formValid: false,
            settings: null as any,
            rules: {
                url: [
                    v => !!v || 'Field may not be empty',
                    v => !v.endsWith('/') || 'URL must not end with a /',
                    v => (/(http:\/\/|https:\/\/).*/gm).test(v) || 'Invalid URL'
                ]
            } 
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

            if(!this.isAdmin) {
                return
            }

            this.fetchSettings()
		})
    },
    methods: {
        previousRoute() {
            this.$router.go(-1)
        },
		returnToDashboard() {
            window.location.href='https://dashboard.intern.mrfriendly.nl'
        },
        fetchSettings() {
            fetch(`${MAILSYNC_SERVER}/settings`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': getCookie('sessionid')
                }
            })
            .then(r => {
                if(!r.ok) {
                    throw r
                }

                switch(r.status) {
                    case 200:
                        r.json().then(j => {
                            interface SettingsResponse {
                                settings: Setting[]
                            }

                            this.loading = false
                            this.settings = (<SettingsResponse> j).settings
                        })
                        break
                    case 429:
                        this.snackbarText = 'Hold up, slow down a bit!'
                        this.snackbar = true
                        this.loading = false
                        break
                    case 401:
                        this.loading = false
                        this.isAdmin = false
                        break
                    default:
                        this.snackbarText = 'Something went wrong. Please try again later'
                        this.snackbar = true
                        this.loading = false
                        break
                }
            })
            .catch(() => {
                this.snackbarText = 'Something went wrong. Please try again later'
                this.snackbar = true
                this.loading = false
            })
        },
        saveSettings() {
            if((this.$refs.form as any).validate()) {
                this.loading = true
                fetch(`${MAILSYNC_SERVER}/settings/update`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': getCookie('sessionid')
                    },
                    body: JSON.stringify({
                        'settings': this.settings
                    })
                })
                .then(r => {
                    if(!r.ok) {
                        throw r
                    }

                    switch(r.status) {
                        case 200:
                            this.loading = false
                            this.snackbar = true,
                            this.snackbarText = 'Settings saved'
                            break
                        default:
                            this.snackbarText = 'Something went wrong. Please try again later'
                            this.snackbar = true
                            this.loading = false       
                    }
                })
                .catch(() => {
                    this.snackbarText = 'Something went wrong. Please try again later'
                    this.snackbar = true
                    this.loading = false                
                })
            }
        },
    }
})
</script>