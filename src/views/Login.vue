<template>
    <v-container>
        <v-card 
            v-if="this.$route.query.session_id != null"
            elevation="2">

            <v-card-title>Hold on..</v-card-title>
        </v-card>

        <v-card 
            v-if="this.$route.session_id == null"
            elevation="2"
            class="mx-auto mt-6" 
            max-width="344" 
            outlined>

            <v-card-title> Invalid request </v-card-title>
            <v-card-text> The way you opened this page is likely not valid. </v-card-text>
            <v-card-actions>
                <div class="text-center">
                    <v-btn floating primary @click="returnToDashboard()" color="primary"> Return to Dashboard </v-btn>
                </div>
            </v-card-actions>
        </v-card>
    </v-container>    
</template>

<script lang="ts">
import Vue from 'vue'
import { setCookie } from '@/login'

interface ComponentData {
    valid: boolean
}

export default Vue.extend({
    data(): ComponentData {
        return {
            valid: false
        }
    },
    created() {
        let sessionId = this.$route.query.session_id
        if(sessionId != null) {
            setCookie('sessionid', sessionId as string, 60*60*24*30)
            window.location.href = '/static/index.html'
            return
        }
    },
    methods: {
        returnToDashboard() {
            window.location.href='https://dashboard.intern.mrfriendly.nl'
        },
    }
})
</script>

