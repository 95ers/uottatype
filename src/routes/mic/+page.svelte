<script lang="ts">
	import { solace } from '$lib/client';

	$effect(() => {
		requestMedia();
	});

	async function requestMedia() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true
			});

			const audioTracks = stream.getAudioTracks();
			const videoTracks = stream.getVideoTracks();

			audio = new MediaRecorder(new MediaStream([audioTracks[0]]));
			video = new MediaRecorder(new MediaStream([videoTracks[0]]));
		} catch (error) {
			console.error(error);
		}
	}

	let audio = $state<MediaRecorder | null>(null);
	let video = $state<MediaRecorder | null>(null);
	let recording = $state(false);

	$effect(() => {
		if (!audio || !video) return;

		audio.ondataavailable = async (event) => {
			const blob = new Blob([event.data], { type: 'audio/webm' });

			solace.publish(
				`95ers/document/someid/user/userid/transcribe/language`,
				await blob.arrayBuffer()
			);
		};
	});

	function onClick() {
		if (!audio) return;

		if (recording) {
			audio.requestData();
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

{#each audio as track}
	<div>
		<p>{track.label}</p>
		<p>{track.readyState}</p>
	</div>
{/each}

{#each video as track}
	<div>
		<p>{track.label}</p>
		<p>{track.readyState}</p>
	</div>
{/each}
