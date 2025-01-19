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
	let cursorListener;

	let messages: string[] = $state([]);
	let msg: string = $state('');

	$effect(() => {
		listener = solace.subscribeJson(`${topic}/update`, onUpdate);
		titleListener = solace.subscribeJson(`${topic}/title`, onTitle);
		messageListener = solace.subscribeJson(`${topic}/message`, onMessage);
		cursorListener = solace.subscribeJson(`${topic}/cursor`, ({ userId, x, y }) => {
			if (userId === data.user.id) return;
			editor.onCursorMove(userId, x, y);
		});
	});

	async function onMessage({ action, userId }: Authenticated<string>) {
		messages.push(action);
		messages = messages.slice(-5);
	}

	onDestroy(() => {
		solace.unsubscribeJson(`${topic}/update`, listener);
		solace.unsubscribeJson(`${topic}/title`, titleListener);
		solace.unsubscribeJson(`${topic}/message`, messageListener);
		solace.unsubscribeJson(`${topic}/cursor`, cursorListener);
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

	async function onGenerateImageText(src: string) {
		const params = new URLSearchParams();

		params.append('image', src);

		const response = await fetch(`/api/generateImageText`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params
		});

		const { imageText } = await response.json();

		return imageText;
	}

	async function onCursorMoved(x: number, y: number) {
		solace.publishJson(`${topic}/cursor`, {
			userId: data.user.id,
			x,
			y
		});
	}
</script>

<Wysiwyg
	bind:this={editor}
	{onContentUpdate}
	{onTitleUpdate}
	{onUserAdd}
	{onGenerateAltText}
	{onGenerateImageText}
	{onCursorMoved}
	document={data.doc}
	user={data.user}
/>

<div class="fixed bottom-0 right-0 m-4 rounded-md border-2 bg-neutral-50/80 p-2">
	{#if messages.length}
		<div class="flex flex-col pb-1">
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
