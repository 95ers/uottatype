import { Client } from '$lib/pubsub';

export const client = new Client({
	url: 'wss://mr-connection-hd19x70b7n9.messaging.solace.cloud:443',
	vpnName: 'ninetyfivers',
	userName: 'solace-cloud-client',
	password: 'mqi3is2n93f88mf1h24e0e7tfe'
});
