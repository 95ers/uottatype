<script lang="ts">
	import type { Authenticated, Updates } from '$lib';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
	import { solace } from '$lib/client';
	import { onDestroy } from 'svelte';
	import Wysiwyg from '$lib/components/wysiwyg.svelte';

	const topic = `95ers/document/${data.doc.id}`;

	let editor: Wysiwyg;
	let listener;

	$effect(() => {
		listener = solace.subscribeJson(`${topic}/update`, onUpdate);
	});

	onDestroy(() => {
		solace.unsubscribeJson(`${topic}/update`, listener);
	});

	async function onUpdate({ action, userId }: Authenticated<Updates>) {
		if (userId === data.user.id) return;

		editor.applyUpdates(action);
	}

	async function onContentUpdate(action: Updates) {
		solace.publishJson(`${topic}/send`, {
			userId: data.user.id,
			action
		});
	}

	async function onUserAdd(username: string) {
		const params = new URLSearchParams();

		params.append('username', username);

		await fetch(`/document/${data.doc.id}?/addUser`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params
		});
	}
	data.doc;
</script>

<Wysiwyg bind:this={editor} {onContentUpdate} {onUserAdd} document={data.doc} />
