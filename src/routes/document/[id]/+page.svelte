<script lang="ts">
	import type { WrappedAction } from '$lib';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
	import { client } from '$lib/solace';
	import { onDestroy } from 'svelte';
	import Wysiwyg from '$lib/components/wysiwyg.svelte';

	const topic = `95ers/document/${data.doc.id}/update`;

	let editor: Wysiwyg;

	$effect(() => {
		client.subscribe(topic, onUpdate);
	});

	onDestroy(() => {
		client.unsubscribe(topic, onUpdate);
	});

	async function onUpdate({ action, userId }: WrappedAction) {
		if (userId === data.user.id) return;

		editor.setSubsliceContent(action.content, action.position, action.position);
	}

	async function onContentUpdate(action: Action) {
		client.publish(topic, {
			userId: data.user.id,
			action
		});
	}
</script>

<Wysiwyg bind:this={editor} {onContentUpdate} />
