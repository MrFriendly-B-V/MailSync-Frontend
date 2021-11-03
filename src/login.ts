export const LOGIN_SERVER = "https://authlander.intern.mrfriendly.nl"

export interface IUser {
	active:		boolean;
	user_id:	string;
	name:		string;
	picture:	string;
	email:		string
}

interface IScopes {
	scopes: string[]
}

export async function getScopes(user: IUser): Promise<string[]> {
	let r = await fetch(`${LOGIN_SERVER}/user/scopes/${user.user_id}`)
	switch(r.status) {
		case 200:
			let json = <IScopes> await r.json() 	
			return json.scopes
		default:
			return null as any
	}
}

export async function logIn(): Promise<IUser> {
	let sessionId = getCookie('sessionid')

	if(sessionId == '') {
		let path = window.location.origin + '/#/login'
		window.location.href = `${LOGIN_SERVER}/oauth2/login?api_name=mailsync&return_uri=${btoa(path)}`
	}

	let r = await fetch(`${LOGIN_SERVER}/session/check/${sessionId}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	})

	switch(r.status) {
		case 200:
			break;

		case 401:
		case 403:
			let path = window.location.origin + '/#/login'
			window.location.href = `${LOGIN_SERVER}/oauth2/login?api_name=mailsync&return_uri=${btoa(path)}`
			break
		default:

			return null as any
	}

	r = await fetch(`${LOGIN_SERVER}/session/describe/${sessionId}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	})

	switch(r.status) {
		case 200:
			let json = <IUser> await r.json()
			return json
		default:
			return null as any
	}
}

/**
 * Set a cookie
 * @param name The name of the cookie
 * @param value The value of the cookie
 * @param ttl The TTL of the cookie in seconds
 */
export function setCookie(name: string, value: string, ttl: number): void {
	let date = new Date()
	date.setTime(date.getTime() + (ttl * 1000))
	let expires = "expires=" + date.toUTCString()

	document.cookie = name + "=" + value + ";" + expires + ";path=/"
}

/**
 * Get the value of a cookie
 * @param name the name of the cookie
 * @returns Retuns the value of the cookie, or '' if the cookie was not found
 */
export function getCookie(name: string): string {
	let re = new RegExp('[; ]'+name+'=([^\\s;]*)')
	let sMatch = (' ' + document.cookie).match(re)
	
	if(name && sMatch) {
		return unescape(sMatch[1])
	}

	return ''
}
