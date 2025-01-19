<script lang="ts">
	import { solace } from '$lib/client';
	import { Mic, MicOff } from 'lucide-svelte';
	import { Button, buttonVariants } from './ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	let input: HTMLInputElement;
	let files: FileList;
	let shown: boolean = false;
	let preview: string;

	function onUpload() {
		let reader = new FileReader();

		reader.onload = function (e) {
			preview = e.target!.result as string;
		};
		reader.readAsDataURL(files[0]);
		shown = true;
	}
	
	function submitImage() {
		if (!files) return;
		
		solace.publish(`95ers/document/${id}/${type}`, buf, userId);
	}
</script>

<Dialog.Root>
	<Dialog.Trigger class={buttonVariants({ variant: 'outline' })}>Open</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
			<Dialog.Description>
				This action cannot be undone. This will permanently delete your account and remove your data
				from our servers.
			</Dialog.Description>
		</Dialog.Header>
		<div class="grid w-full max-w-sm items-center gap-1.5">
			<Label for="picture">Picture</Label>
			<input accept="image/*" id="picture" type="file" bind:files={files} onchange={onUpload} />
			{#if shown}
				<img id="preview" src={preview} alt="Preview" />
				<Button onclick={submitImage}/>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
