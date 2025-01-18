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
	let titleListener;

	$effect(() => {
		listener = solace.subscribeJson(`${topic}/update`, onUpdate);
		titleListener = solace.subscribeJson(`${topic}/title`, onTitle);
	});

	onDestroy(() => {
		solace.unsubscribeJson(`${topic}/update`, listener);
		solace.unsubscribeJson(`${topic}/title`, titleListener);
	});

	async function onUpdate({ action, userId }: Authenticated<Updates>) {
		if (userId === data.user.id) return;

		editor.applyUpdates(action);
	}

	async function onTitle({ action, userId }: Authenticated<string>) {
		if (userId === data.user.id) return;

		editor.setTitle(action);
	}

	async function onContentUpdate(action: Updates) {
		solace.publishJson(`${topic}/send`, {
			userId: data.user.id,
			action
		});
	}

	async function onTitleUpdate(title: string) {
		solace.publishJson(`${topic}/title`, {
			userId: data.user.id,
			action: title
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

	async function onGenerateAltText(image: HTMLImageElement) {
		const params = new URLSearchParams();

		params.append('image', image.src);

		const response = await fetch(`/api/generateAltText`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params
		});

		const { altText } = await response.json();

		return altText;
	}
</script>

<Wysiwyg
	bind:this={editor}
	{onContentUpdate}
	{onTitleUpdate}
	{onUserAdd}
	{onGenerateAltText}
	document={data.doc}
	userId={data.user.id}
/>
