<template>
    <v-container>
        <v-card
            v-if="this.id != null"
            elevation="2"
            class="mx-auto mt-6">

            <v-container>
                <v-row>
                    <v-col class="mx-auto ">
                        <v-container>
                            <v-btn 
                                fab
                                small
                                v-if="this.$route.query.ref != null"
                                @click="backToMail()">
                                <v-icon>mdi-arrow-left</v-icon>
                            </v-btn>
                        </v-container>
                    </v-col>
                </v-row> 
                <v-divider></v-divider>
                <v-progress-linear indeterminate absolute v-if="loading"></v-progress-linear>
                <div v-if="message != null" class="mt-3">
                    <div class="text-h4"> {{ message.subject }} </div>
                    <div> From: {{ message.from }} </div>
                    <div class="text-caption"> To: {{ message.to }} </div>
                    <div class="text-caption" v-if="message.cc != null"> Cc: {{ message.cc }} </div>
                    <div class="text-caption" v-if="message.bcc != null"> Bcc: {{ message.bcc }} </div>
                    <v-divider></v-divider>
                    <div v-if="message.body != null" v-html="message.body"></div>
                    <div v-else>Unable to load message body.</div> 
                </div>
            </v-container>
        </v-card>


        <v-snackbar
            v-model="error">
            {{errorText}}
            <template v-slot:action="{ attrs }">
                <v-btn
                    color="primary"
                    text
                    v-bind="attrs"
                    @click="error = false">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script lang="ts">
import Vue from 'vue'
import { MAILSYNC_SERVER } from '@/main'
import { getCookie } from '@/login' 
import { Message } from '@/types'

interface ComponentData {
    loading:    boolean,
    error:      boolean,
    errorText:  string,
    message:    Message
}

export default Vue.extend({
    props: {
        id: String
    },
    data(): ComponentData {
        return {
            loading: true,
            error: false,
            errorText: null as any,
            message: null as any,
        }
    },
    created() {
        this.fetchData()
    },
    methods: {
        backToMail() {
            if(this.$route.query.ref != null) {
                this.$router.push({ name: 'home', query: { ref: this.$route.query.ref }})
            }
        },
        fetchData() {
            fetch(`${MAILSYNC_SERVER}/mail/message/${this.id}`, {
                method: 'GET',
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
                            this.loading = false
                            this.message = j

                            if(this.message != null && this.message.body != null) {
                                this.message.body = atob(this.message.body)
                            }
                        })
                        break
                    case 401:
                        this.loading = false
                        this.errorText = 'You do not have access to this resource'
                        this.error = true
                        break
                    case 429:
                        this.loading = false
                        this.errorText = "You're going too fast. Slow down"
                        this.error = true
                        break
                    default:
                        this.loading = false
                        this.error = true
                        this.errorText = 'Something went wrong. Please try again later'
                }
            })
            .catch(() => {
                this.error = true
                this.errorText = 'Something went wrong. Please try again later'
            })
        }
    }
})

</script>