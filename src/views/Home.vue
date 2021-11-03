<template>
    <v-container>
        <v-card v-if="this.ref == null" elevation="2" class="mx-auto mt-6" max-width="344" outlined>
            <v-card-title> Invalid request </v-card-title>
            <v-card-text> The way you opened this page is likely not valid. </v-card-text>
            <v-card-actions>
                <div class="text-center">
                    <v-btn floating primary @click="returnToDashboard()" color="primary"> Return to Dashboard </v-btn>
                </div>
            </v-card-actions>
        </v-card>

        <v-card v-if="this.ref != null">
            <v-card-title> 
                Emails 

            </v-card-title>
            <v-data-table
                :loading="this.loading" 
                :items="messages" 
                :headers="headers" 
                class="elevation-2"
                :options.sync="options"
                :server-items-length="totalMails"
                :sort-by.sync="sortBy"
                :sort-desc.sync="sortDesc"
                @click:row="handleClick"></v-data-table>
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
import { DataTableHeader } from 'vuetify'
import { Message } from '@/types'

interface ComponentData {
    ref:        string | (string | null)[]
    page:       number
    messages:   Message[]
    headers:    DataTableHeader[]
    loading:    boolean
    options:    any
    totalMails: number
    error:      boolean,
    errorText:  string
    sortDesc:   boolean,
    sortBy:     string
}

interface Mail {
    messages:       Message[]
    page:           number,
    hasNextPage:    boolean,
    totalAvailable: number
}

export default Vue.extend({
    data(): ComponentData {
        return {
            ref: this.$route.query.ref,
            page: 1,
            messages: [],
            loading: true,
            options: {},
            totalMails: 20,
            error: false,
            errorText: null as any,
            sortBy: null as any,
            sortDesc: null as any,
            headers: [
                {
                    text: 'From',
                    value: 'from'
                },
                {
                    text: 'To',
                    value: 'to'
                },
                {
                    text: 'Subject',
                    value: 'subject'
                },
                {
                    text: 'Cc',
                    value: 'cc'
                },
                {
                    text: 'Bcc',
                    value: 'bcc'
                }
            ]
        }
    },
    watch: {
        options: {
            handler() {
                this.fetchData()
            }
        }
    },
    methods: {
        handleClick(row: Message) {
            this.$router.push({name: 'message', params: { id: row.id}, query: { ref: this.ref }})

        },
        returnToDashboard() {
            window.location.href='https://dashboard.intern.mrfriendly.nl'
        },
        fetchData() {
            const { sortBy, sortDesc, page, itemsPerPage } = this.options

            let query = `q=${this.$data.ref}`
            if(sortBy != null) {
                query += `&sort_by=${sortBy}`
            }

            if(sortDesc != null) {
                query += `&sort=${sortDesc ? 'desc' : 'asc'}`
            }

            if(page != null) {
                query += `&page=${page}`
            }

            if(itemsPerPage != null) {
                query += `&page_size=${itemsPerPage}`
            }

            fetch(`${MAILSYNC_SERVER}/mail/inbox?${query}`, {
                method: 'GET',
                headers: {
                    'Authorization': getCookie('sessionid')
                }
            })
            .then(async r => {
                if(!r.ok) {
                    throw r
                }

                switch(r.status) {
                    case 200:
                        r.json().then(j => {
                            let d = <Mail> j
                            this.$data.totalMails = d.totalAvailable
                            this.$data.messages = d.messages
                            this.$data.loading = false
                        })
                        break
                    case 429:
                        this.error = true
                        this.errorText = 'Woah, slow down a bit!'
                        this.loading = false
                        break
                    case 401:
                        this.error = true
                        this.errorText = 'It appears you do not have access to this resource.'
                        this.loading = false
                        break
                    default:
                        this.error = true
                        this.errorText = 'Hm, something went wrong. Please try again later!'
                        this.loading = false
                        break
                }
            })
            .catch(() => {
                this.error = true
                this.errorText = 'Something went wrong. Please try again alter'
            })
        }
    }
})

</script>