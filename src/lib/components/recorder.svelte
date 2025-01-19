<script lang="ts">
	import { solace } from '$lib/client';
	import { Mic, MicOff } from 'lucide-svelte';
	import { Button } from './ui/button';
	import * as Select from './ui/select';

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
					chunks = [];
					const buf = await blob.arrayBuffer();

					solace.publish(`95ers/document/${id}/${type.value}`, buf, userId);
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

	let type: {
		value: string;
		label: string;
	} = $state({
		value: 'transcribe',
		label: 'Transcribe'
	});

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

<Select.Root portal={null} bind:selected={type}>
	<Select.Trigger class="w-[180px]">
		<Select.Value placeholder="Select a fruit" />
	</Select.Trigger>
	<Select.Content>
		<Select.Item value="transcribe" label="Transcribe">Transcribe</Select.Item>
		<Select.Item value="write" label="Write">Write</Select.Item>
	</Select.Content>
	<Select.Input name="favoriteFruit" />
</Select.Root>

<Button onclick={onClick} disabled={audio === null}>
	{#if recording}
		<Mic size={24} />
	{:else}
		<MicOff size={24} />
	{/if}
</Button>
