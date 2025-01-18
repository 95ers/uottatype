<script lang="ts">
	import { solace } from '$lib/client';
	import type solaceJs from 'solclientjs';
	import { onDestroy } from 'svelte';

	let {
		userId,
		documentId,
		initialLine
	}: {
		userId: string;
		documentId: string;
		initialLine: number;
	} = $props();

	let line = $state(initialLine);

	export function setLine(l: number) {
		line = l;
	}

	type Entry = {
		audioContext: AudioContext;
		audioNode?: AudioBufferSourceNode;
		audio: HTMLAudioElement;
	};

	type UserId = string;

	const sources = new Map<UserId, Entry>();

	$effect(() => {
		requestMedia();
		solace.subscribe(`95ers/document/${documentId}/proximity`, onAudio);
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

		if (meta.userId === userId) return;
		if (Math.abs(meta.line - line) > 3) return;

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
					JSON.stringify({ userId, line })
				);
			};

			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}
</script>
