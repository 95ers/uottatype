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
		mediaSource: MediaSource;
		sourceBuffer?: SourceBuffer;
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

		for (const { mediaSource, sourceBuffer, audio } of sources.values()) {
			mediaSource.endOfStream();

			if (sourceBuffer) {
				mediaSource.removeSourceBuffer(sourceBuffer);
				sourceBuffer.abort();
			}

			audio.remove();
		}
	});

	function onAudio(message: solaceJs.Message) {
		const meta = JSON.parse(message.getUserData());

		if (meta.userId === userId) return;
		if (Math.abs(meta.line - line) > 3) return;

		const buffer = message.getBinaryAttachment();

		// get or create
		if (!sources.has(meta.userId)) {
			const mediaSource = new MediaSource();
			const audio = new Audio();
			audio.src = URL.createObjectURL(mediaSource);
			audio.play();

			const obj = { mediaSource, audio, sourceBuffer: undefined } as Entry;

			mediaSource.addEventListener('sourceopen', () => {
				const sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs=opus');
				obj.sourceBuffer = sourceBuffer;
				sourceBuffer.appendBuffer(buffer as Uint8Array);
			});

			sources.set(meta.userId, obj);
		} else {
			const { sourceBuffer } = sources.get(meta.userId)!;

			if (sourceBuffer) {
				sourceBuffer.appendBuffer(buffer as Uint8Array);
			}
		}
	}

	async function requestMedia() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true
			});

			audio = new MediaRecorder(stream, {
				audioBitsPerSecond: 32_000,
				mimeType: 'audio/webm; codecs=opus'
			});

			audio.ondataavailable = async (event) => {
				solace.publish(
					`95ers/document/${documentId}/proximity`,
					await event.data.arrayBuffer(),
					JSON.stringify({ userId, line })
				);
			};

			audio.start(100);

			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	let audio = $state<MediaRecorder | null>(null);
</script>
