<script lang="ts">
	import { solace } from '$lib/client';
	import { Mic, MicOff } from 'lucide-svelte';
	import { Button } from './ui/button';

	let { id, userId }: { id: string; userId: string } = $props();

	$effect(() => {
		requestMedia();
	});

	async function requestMedia() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true
			});

			audio = new MediaRecorder(stream, {
				audioBitsPerSecond: 16_000
			});

			audio.ondataavailable = async (event) => {
				chunks.push(event.data);

				if (!recording) {
					const blob = new Blob(chunks, { type: event.data.type });
					const buf = await blob.arrayBuffer();

					solace.publish(`95ers/document/${id}/transcribe`, buf, userId);
				}
			};

			return true;
		} catch {
			return false;
		}
	}

	let audio = $state<MediaRecorder | null>(null);
	let recording = $state(false);

	let chunks: Blob[] = [];

	$effect(() => {});

	async function onClick() {
		if (!audio) {
			const good = await requestMedia();

			if (!good || !audio) return;
		}

		if (recording) {
			audio.stop();
			recording = false;
		} else {
			audio.start();
			recording = true;
		}
	}
</script>

<Button onclick={onClick} disabled={audio === null}>
	{#if recording}
		<Mic size={24} />
	{:else}
		<MicOff size={24} />
	{/if}
</Button>
