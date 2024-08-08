import * as crypto from "crypto"

const sab = new SharedArrayBuffer(1024)

interface IOauthParams {
	oauth_consumer_key: string
	oauth_signature_method: string
	oauth_signature?: string
	oauth_version: string
	oauth_token: string
	oauth_timestamp: string
	oauth_nonce: string
}

// implements Oauth 1.0a
export default class Oauth {
	private apiKey: string
	private apiSecret: string
	private userToken: string
	private userSecret: string
	private nonceCounter: BigUint64Array

	constructor(api_key: string, api_secret: string, user_token: string, user_secret: string) {
		this.apiKey = api_key
		this.apiSecret = api_secret
		this.userToken = user_token
		this.userSecret = user_secret
		this.nonceCounter = new BigUint64Array(sab)

		const buffer = crypto.randomBytes(8)
		Atomics.store(this.nonceCounter, 0, buffer.readBigUInt64BE())
	}

	public authorizationHeader(url: string): string {
		const oauthParams: IOauthParams = {
			oauth_consumer_key: this.apiKey,
			oauth_signature_method: "HMAC-SHA1",
			oauth_version: "1.0",
			oauth_token: this.userToken,
			oauth_timestamp: Math.floor(new Date().getTime() / 1000).toString(),
			oauth_nonce: this.nonce(),
		}

		const signature = this.getHMACSignature(url, oauthParams)
		oauthParams.oauth_signature = signature

		return `OAuth oauth_consumer_key="${this.encode(
			oauthParams.oauth_consumer_key,
			false
		)}", oauth_signature_method="${this.encode(
			oauthParams.oauth_signature_method,
			false
		)}", oauth_signature="${this.encode(oauthParams.oauth_signature, false)}", oauth_version="${this.encode(
			oauthParams.oauth_version,
			false
		)}", oauth_token="${this.encode(oauthParams.oauth_token, false)}", oauth_timestamp="${this.encode(
			oauthParams.oauth_timestamp,
			false
		)}", oauth_nonce="${this.encode(oauthParams.oauth_nonce, false)}"`
	}

	private nonce(): string {
		Atomics.add(this.nonceCounter, 0, BigInt(1))
		return Atomics.load(this.nonceCounter, 0).toString(16)
	}

	private getHMACSignature(urlStr: string, oauthParams: IOauthParams): string {
		let key = this.encode(this.apiSecret, false) + "&"
		const u = new URL(urlStr)

		if (this.userSecret) {
			key += this.encode(this.userSecret, false)
		}

		const hmac = crypto.createHmac("sha1", key)
		const baseString = this.writeBaseString("GET", u, {}, oauthParams)
		hmac.update(baseString)

		const signature = hmac.digest("base64")
		return signature
	}

	private writeBaseString(method: string, urlObject: URL, form: Object, oauthParams: IOauthParams): string {
		const scheme = urlObject.protocol.slice(0, -1).toLowerCase()
		let host = urlObject.host.toLowerCase()

		if (scheme === "http" && host.endsWith(":80")) {
			host = host.slice(0, -3)
		} else if (scheme === "https" && host.endsWith(":443")) {
			host = host.slice(0, -4)
		}

		const path = urlObject.pathname

		let baseString =
			this.encode(method.toUpperCase(), false) + "&" + this.encode(scheme + "://" + host + path, false) + "&"

		let allParams = []
		urlObject.searchParams.forEach((value, key) => {
			allParams.push([this.encode(key, true), this.encode(value, true)])
		})

		for (const [key, value] of Object.entries(form)) {
			allParams.push([this.encode(key, true), this.encode(value, true)])
		}

		for (const [key, value] of Object.entries(oauthParams)) {
			allParams.push([this.encode(key, true), this.encode(value, true)])
		}

		allParams.sort((a, b) => {
			if (a[0] === b[0]) {
				return a[1] < b[1] ? -1 : 1
			}
			return a[0] < b[0] ? -1 : 1
		})

		const paramString = allParams.map(param => param.join("=")).join("&")
		baseString += this.encode(paramString, false)

		return baseString
	}

	private encode(str: string, doubleEncode: boolean): string {
		let encoded = encodeURIComponent(str).replace(/[!'()*]/g, char => {
			return "%" + char.charCodeAt(0).toString(16).toUpperCase()
		})
		if (doubleEncode) {
			encoded = encodeURIComponent(encoded)
		}
		return encoded
	}
}
