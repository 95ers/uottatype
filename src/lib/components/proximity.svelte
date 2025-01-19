<script lang="ts">
	import { solace } from '$lib/client';
	import type { User } from '$lib/server/db/schema';
	import type solaceJs from 'solclientjs';
	import { onDestroy } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';

	let {
		user,
		documentId,
		initialLine
	}: {
		user: User;
		documentId: string;
		initialLine: number;
	} = $props();

	const PROXIMITY_THRESHOLD = 5;

	let line = $state(initialLine);

	export function setLine(l: number) {
		line = l;

		solace.publishJson(`95ers/document/${documentId}/line`, { username: user.username, line });
	}

	type Entry = {
		audioContext: AudioContext;
		audioNode?: AudioBufferSourceNode;
		audio: HTMLAudioElement;
	};

	type UserId = string;

	const sources = new Map<UserId, Entry>();
	const lines = new SvelteMap<UserId, number>();

	$effect(() => {
		requestMedia();
		solace.subscribe(`95ers/document/${documentId}/proximity`, onAudio);
		solace.subscribeJson(`95ers/document/${documentId}/line`, ({ username, line: l }) => {
			if (username === user.username) return;

			lines.set(username, l);
		});
	});

	onDestroy(() => {
		solace.unsubscribe(`95ers/document/${documentId}/proximity`, onAudio);

		for (const { audioContext, audioNode, audio } of sources.values()) {
			audioNode?.disconnect();
			audioContext.close();
			audio.remove();
		}
	});

	function onAudio(message: solaceJs.Message) {
		const meta = JSON.parse(message.getUserData());

		if (meta.userId === user.id) return;
		if (Math.abs(meta.line - line) > PROXIMITY_THRESHOLD) return;

		const array = message.getBinaryAttachment() as Uint8Array;
		const buffer = array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset);

		if (!sources.has(meta.userId)) {
			const audioContext = new AudioContext();
			const audio = new Audio();
			audio.play();

			const obj = { audioContext, audio } as Entry;
			sources.set(meta.userId, obj);
		}

		const { audioContext } = sources.get(meta.userId)!;

		// Convert the raw PCM data to an AudioBuffer
		const rawPCMData = new Float32Array(buffer);
		const audioBuffer = audioContext.createBuffer(1, rawPCMData.length, audioContext.sampleRate);

		audioBuffer.copyToChannel(rawPCMData, 0);

		// Play the audio buffer
		const audioNode = audioContext.createBufferSource();
		audioNode.buffer = audioBuffer;
		audioNode.connect(audioContext.destination);
		audioNode.start();
	}

	async function requestMedia() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true
			});

			const audioContext = new AudioContext();
			const source = audioContext.createMediaStreamSource(stream);
			const processor = audioContext.createScriptProcessor(4096, 1, 1);

			source.connect(processor);
			processor.connect(audioContext.destination);

			processor.onaudioprocess = (event) => {
				const inputBuffer = event.inputBuffer;
				const rawData = inputBuffer.getChannelData(0); // Get PCM data

				solace.publish(
					`95ers/document/${documentId}/proximity`,
					rawData.buffer,
					JSON.stringify({ userId: user.id, line })
				);
			};

			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	const len = $derived(
		[...lines.values()].filter((l) => Math.abs(l - line) <= PROXIMITY_THRESHOLD).length
	);
</script>

<div class="fixed bottom-0 left-0 m-4 rounded-md border-2 bg-neutral-50 p-4">
	<h1>
		<span class="font-bold">Voice</span> ({len} member{len === 1 ? '' : 's'}):
		{[...lines.entries()]
			.filter(([_, l]) => Math.abs(l - line) <= PROXIMITY_THRESHOLD)
			.map(([username]) => username)
			.join(', ') || 'No one nearby'}
	</h1>
</div>
