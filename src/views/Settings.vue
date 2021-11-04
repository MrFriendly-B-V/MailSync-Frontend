<template>
    <div>
        <!-- Little snackbar at the bottom -->
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

        <!-- Content -->
        <v-container>
            <v-card
                v-if="isAdmin"
                class="mx-auto mt-6"
                elevation="2">
            
                <v-card-title class="headline">MailSync Settings</v-card-title>
                <v-container>
                    <!-- Administrative settings form -->
                    <div>
                        <div class="text-h4">Server</div>
                        <!-- Loading overlay -->
                        <v-overlay 
                            :value="serverSettingsLoading"
                            absolute
                            z-index="10"
                            opacity="0">
                            <v-progress-circular
                                indeterminate
                                color="primary"
                                size="64"
                            ></v-progress-circular>
                        </v-overlay>
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
                        </v-form>
                    </div>
                    <!-- Save/Cancel buttons -->
                    <div class="d-flex">
                        <v-spacer></v-spacer>
                        <v-btn 
                            depressed
                            color="red"
                            class="ma-2 white--text"
                            @click="previousRoute()">
                            Cancel
                        </v-btn>
                        <v-btn
                            depressed
                            @click="saveServerSettings"
                            color="primary"
                            class="ma-2 white--text">
                            Save
                        </v-btn>
                    </div>

                    <!-- User settings table -->
                    <div class="text-h4">Users</div>
                    <v-data-table
                        :loading="usersLoading"
                        :items="users"
                        :headers="usersHeaders">

                        <template v-slot:[`item.active`]="{ item }">
                            <v-checkbox
                                v-model="item.active"
                                :ripple="false"
                                @change="updateUserEnabled(item)"></v-checkbox>
                        </template>
                    </v-data-table>

                    <!-- Return button -->
                    <div class="d-flex">
                        <v-spacer></v-spacer>
                        <v-btn 
                            depressed
                            color="red"
                            class="ma-2 white--text"
                            @click="previousRoute()">
                            Cancel
                        </v-btn>
                    </div>
                </v-container>
            </v-card>

            <!-- Shown when a user is not authorized --> 
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
        </v-container>
    </div>
</template>

<script lang="ts">
import { getCookie, getScopes } from '@/login'
import { MAILSYNC_SERVER } from '@/main'
import Vue from 'vue'
import { DataTableHeader } from 'vuetify'

interface ComponentData {
    isAdmin:                boolean
    serverSettingsLoading:  boolean
    snackbar:               boolean
    snackbarText:           string
    formValid:              boolean
    settings:               Setting[]
    rules:                  Rules
    usersLoading:           boolean
    users:                  User[],
    usersHeaders:           DataTableHeader[]
}

interface Rules {
    url: { (input: string ): string | boolean; }[]
}

interface Setting {
    name:       string,
    value:      string
    rule_type:  string
}

interface User {
    id:     string
    name:   string
    email:  string
    active: boolean
}

export default Vue.extend({
    data(): ComponentData {
        return {
            isAdmin: false,
            serverSettingsLoading: true,
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
            },
            usersLoading: true,
            users: [],
            usersHeaders: [
                {
                    text: 'Name',
                    value: 'name'
                },
                {
                    text: 'Email',
                    value: 'email'
                },
                {
                    text: 'Enabled',
                    value: 'active'
                }
            ]
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

            this.fetchServerSettings()
            this.fetchUsers()
		})
    },
    methods: {
        previousRoute() {
            this.$router.go(-1)
        },
		returnToDashboard() {
            window.location.href='https://dashboard.intern.mrfriendly.nl'
        },
        updateUserEnabled(user: User) {
            if(user.active) {
                fetch(`${MAILSYNC_SERVER}/user/add?user_id=${user.id}`, {
                    method: 'POST',
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
                            this.snackbarText = 'User added'
                            this.snackbar = true
                            break
                        case 429:
                            this.snackbarText = 'Hold up, slow down a bit!'
                            this.snackbar = true
                            this.usersLoading = false
                            break
                        case 401:
                            this.usersLoading = false
                            this.isAdmin = false
                            break
                        default:
                            this.snackbarText = 'Something went wrong. Please try again later'
                            this.snackbar = true
                            this.usersLoading = false
                            break                            
                    }
                })
                .catch(() => {
                    this.snackbarText = 'Something went wrong. Please try again later'
                    this.snackbar = true
                    this.serverSettingsLoading = false
                })
            } else {
                fetch(`${MAILSYNC_SERVER}/user/remove?user_id=${user.id}`, {
                    method: 'POST',
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
                            this.snackbarText = 'User removed'
                            this.snackbar = true
                            break
                        case 429:
                            this.snackbarText = 'Hold up, slow down a bit!'
                            this.snackbar = true
                            this.usersLoading = false
                            break
                        case 401:
                            this.usersLoading = false
                            this.isAdmin = false
                            break
                        default:
                            this.snackbarText = 'Something went wrong. Please try again later'
                            this.snackbar = true
                            this.usersLoading = false
                            break                            
                    }
                })
                .catch(() => {
                    this.snackbarText = 'Something went wrong. Please try again later'
                    this.snackbar = true
                    this.serverSettingsLoading = false
                })
            }
        },
        fetchUsers() {
            fetch(`${MAILSYNC_SERVER}/user/list`, {
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
                            interface UsersResponse {
                                users:  User[]
                            }

                            this.users = (<UsersResponse> j).users
                            this.usersLoading = false
                        })
                        break
                    case 429:
                        this.snackbarText = 'Hold up, slow down a bit!'
                        this.snackbar = true
                        this.usersLoading = false
                        break
                    case 401:
                        this.usersLoading = false
                        this.isAdmin = false
                        break
                    default:
                        this.snackbarText = 'Something went wrong. Please try again later'
                        this.snackbar = true
                        this.usersLoading = false
                        break
                }
            })
            .catch(() => {
                this.snackbarText = 'Something went wrong. Please try again later'
                this.snackbar = true
                this.serverSettingsLoading = false
            })
        },
        fetchServerSettings() {
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

                            this.serverSettingsLoading = false
                            this.settings = (<SettingsResponse> j).settings
                        })
                        break
                    case 429:
                        this.snackbarText = 'Hold up, slow down a bit!'
                        this.snackbar = true
                        this.serverSettingsLoading = false
                        break
                    case 401:
                        this.serverSettingsLoading = false
                        this.isAdmin = false
                        break
                    default:
                        this.snackbarText = 'Something went wrong. Please try again later'
                        this.snackbar = true
                        this.serverSettingsLoading = false
                        break
                }
            })
            .catch(() => {
                this.snackbarText = 'Something went wrong. Please try again later'
                this.snackbar = true
                this.serverSettingsLoading = false
            })
        },
        saveServerSettings() {
            if((this.$refs.form as any).validate()) {
                this.serverSettingsLoading = true
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
                            this.serverSettingsLoading = false
                            this.snackbar = true,
                            this.snackbarText = 'Settings saved'
                            break
                        default:
                            this.snackbarText = 'Something went wrong. Please try again later'
                            this.snackbar = true
                            this.serverSettingsLoading = false       
                    }
                })
                .catch(() => {
                    this.snackbarText = 'Something went wrong. Please try again later'
                    this.snackbar = true
                    this.serverSettingsLoading = false                
                })
            }
        },
    }
})

</script>