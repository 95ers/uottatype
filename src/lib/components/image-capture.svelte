<script lang="ts">
	import { CameraOff, Clapperboard, ImagePlus, Sparkles } from 'lucide-svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button, buttonVariants } from './ui/button';

	const VideoStatus = {
		ENABLED: 0,
		DISABLED: 1,
		BLOCKED: 2
	};

	let {
		onSubmit
	}: {
		onSubmit: (preview: string) => void;
	} = $props();

	let canvas: HTMLCanvasElement;
	let video: HTMLVideoElement;

	let file: HTMLInputElement;
	let width: number = $state(0);
	let height: number = $state(0);

	let preview: string = $state('');
	let videoStatus = $state(VideoStatus.DISABLED);

	async function enableCamera() {
		try {
			video.srcObject = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: false
			});

			await video.play();
			videoStatus = VideoStatus.ENABLED;
		} catch (e) {
			videoStatus = VideoStatus.BLOCKED;
		}
	}

	function takePicture() {
		clearCanvas();

		canvas.getContext('2d')!.drawImage(video, 0, 0);
		preview = canvas.toDataURL('image/jpeg');
	}

	function submitFile() {
		clearCanvas();

		let reader = new FileReader();

		reader.onload = function (e) {
			preview = e.target!.result as string;
		};

		reader.readAsDataURL(file.files![0]);
	}

	async function submitPicture() {
		onSubmit(preview);
		open = false;
		preview = '';
		clearCanvas();
	}

	function clearCanvas() {
		canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
	}

	let open = $state(false);
</script>

<Dialog.Root bind:open onOpenChange={(o) => (open = o)}>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>OCR</Dialog.Trigger>
	<Dialog.Content class="max-w-4xl">
		<Dialog.Header>
			<Dialog.Title>Image to text</Dialog.Title>
			<Dialog.Description>
				Take a picture or upload an image to extract text from it.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid aspect-video h-3/5 w-full grid-cols-2 place-items-center gap-4">
			{#if videoStatus !== VideoStatus.ENABLED}
				{#if videoStatus === VideoStatus.BLOCKED}
					<div
						class="grid aspect-square w-full place-items-center rounded-3xl bg-neutral-100 transition-all duration-300 hover:bg-neutral-200"
					>
						<CameraOff class="h-8 w-8" />
					</div>
				{:else}
					<button
						class="grid aspect-square w-full place-items-center rounded-3xl bg-neutral-100 transition-all duration-300 hover:bg-neutral-200"
						onclick={enableCamera}
					>
						<Clapperboard class="h-8 w-8" />
					</button>
				{/if}
			{/if}

			<div
				class="relative flex aspect-square h-full w-full place-items-center overflow-hidden rounded-3xl bg-black"
				class:hidden={videoStatus !== VideoStatus.ENABLED}
			>
				<video muted bind:this={video} bind:videoWidth={width} bind:videoHeight={height}>
					Video stream not available.
				</video>

				<div class="absolute bottom-0 left-0 right-0 flex place-content-center p-4">
					<button
						id="start"
						class="h-8 w-8 rounded-full bg-white outline outline-1 outline-offset-4 outline-white hover:bg-gray-300"
						onclick={takePicture}
					></button>
				</div>
			</div>

			<label class="aspect-square w-full cursor-pointer">
				{#if preview}
					<div
						class="relative flex h-full w-full place-items-center overflow-hidden rounded-3xl bg-black"
						class:hidden={!preview}
					>
						<img alt="Could not load" class="h-full w-full object-cover" src={preview} />
					</div>
				{:else}
					<div
						class="grid h-full w-full place-items-center rounded-3xl bg-neutral-100 transition-all duration-300 hover:bg-neutral-200"
					>
						<ImagePlus class="h-8 w-8" />
					</div>
				{/if}

				<input accept="image/*" bind:this={file} type="file" onchange={submitFile} class="hidden" />
			</label>
		</div>

		<Dialog.Footer>
			<Button disabled={!preview} onclick={submitPicture}>
				Submit <Sparkles class="pl-2" />
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<canvas bind:this={canvas} class="hidden" {width} {height}></canvas>
<canvas bind:this={canvas} class="hidden" {width} {height}></canvas>
