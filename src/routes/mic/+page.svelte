<script lang="ts">
	import { solace } from '$lib/client';

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

					console.log(blob);

					solace.publish(`95ers/document/someid/transcribe`, buf, '123');
				}
			};
		} catch (error) {
			console.error(error);
		}
	}

	let audio = $state<MediaRecorder | null>(null);
	let recording = $state(false);

	let chunks: Blob[] = [];

	$effect(() => {
		requestMedia();
	});

	async function onClick() {
		if (!audio) return;

		if (recording) {
			audio.stop();
			recording = false;
		} else {
			audio.start();
			recording = true;
		}
	}
</script>

<button onclick={onClick} disabled={audio === null}>
	{recording ? 'Stop Recording' : 'Start Recording'}
</button>
