<script lang="ts">
	import type { Authenticated, Updates } from '$lib';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
	import { solace } from '$lib/client';
	import { onDestroy } from 'svelte';
	import Wysiwyg from '$lib/components/wysiwyg.svelte';

	const topic = `95ers/document/${data.doc.id}/update`;

	let editor: Wysiwyg;

	$effect(() => {
		solace.subscribe(topic, onUpdate);
	});

	onDestroy(() => {
		solace.unsubscribe(topic, onUpdate);
	});

	async function onUpdate({ action, userId }: Authenticated<Updates>) {
		if (userId === data.user.id) return;

		editor.setSubsliceContent(action.content, action.position, action.position);
	}

	async function onContentUpdate(action: Updates) {
		solace.publishJson(topic, {
			userId: data.user.id,
			action
		});
	}
</script>

<Wysiwyg bind:this={editor} {onContentUpdate} />
