<script lang="ts">
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
	import { client } from '$lib/solace';
	import { onDestroy } from 'svelte';
	import Wysiwyg, { type Action } from '$lib/components/wysiwyg.svelte';

	const topic = `/95ers/document/${data.doc.id}/update`;

	let editor: Wysiwyg;

	$effect(() => {
		client.subscribe(topic, onUpdate);
	});

	onDestroy(() => {
		client.unsubscribe(topic, onUpdate);
	});

	async function onUpdate(action: Action) {
		editor.setSubsliceContent(action.content, action.position, action.position);
	}

	async function onContentUpdate(action: Action) {
		client.publish(topic, action);
	}
</script>

<Wysiwyg bind:this={editor} {onContentUpdate} />
