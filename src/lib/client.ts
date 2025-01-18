import {
	PUBLIC_SOLACE_PASSWORD,
	PUBLIC_SOLACE_URL,
	PUBLIC_SOLACE_USERNAME,
	PUBLIC_SOLACE_VPN_NAME
} from '$env/static/public';
import { Client as Solace } from '$lib/pubsub';

export const solace = new Solace({
	url: PUBLIC_SOLACE_URL,
	vpnName: PUBLIC_SOLACE_VPN_NAME,
	userName: PUBLIC_SOLACE_USERNAME,
	password: PUBLIC_SOLACE_PASSWORD
});
