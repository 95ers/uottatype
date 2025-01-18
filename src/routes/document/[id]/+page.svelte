<script lang="ts">
	import type { Authenticated, Updates } from '$lib';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
	import { solace } from '$lib/client';
	import { onDestroy } from 'svelte';
	import Wysiwyg from '$lib/components/wysiwyg.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	const topic = `95ers/document/${data.doc.id}`;

	let editor: Wysiwyg;
	let listener;
	let titleListener;
	let messageListener;

	let messages: string[] = $state([]);
	let msg: string = $state('');

	$effect(() => {
		listener = solace.subscribeJson(`${topic}/update`, onUpdate);
		titleListener = solace.subscribeJson(`${topic}/title`, onTitle);
		messageListener = solace.subscribeJson(`${topic}/message`, onMessage);
	});

	async function onMessage({ action, userId }: Authenticated<string>) {
		messages.push(action);
	}

	onDestroy(() => {
		solace.unsubscribeJson(`${topic}/update`, listener);
		solace.unsubscribeJson(`${topic}/title`, titleListener);
		solace.unsubscribeJson(`${topic}/message`, messageListener);
	});

	async function onUpdate({ action, userId }: Authenticated<Updates>) {
		if (userId === data.user.id) return;

		editor.applyUpdates(action);
	}

	function onSendMessage() {
		solace.publishJson(`${topic}/message`, {
			userId: data.user.id,
			action: `${data.user.username}: ${msg}`
		});

		msg = '';
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

<div class="fixed bottom-0 right-0 m-16 rounded-md border-2 p-4">
	{#if messages.length}
		<div class="my-2 flex flex-col gap-4">
			{#each messages as message}
				<p>{message}</p>
			{/each}
		</div>
	{/if}
	<form class="flex gap-4" onsubmit={onSendMessage}>
		<Input placeholder="Chat!" bind:value={msg}></Input>
		<Button type="submit">Send</Button>
	</form>
</div>
