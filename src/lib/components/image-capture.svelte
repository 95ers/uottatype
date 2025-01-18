<script lang="ts">
	import { solace } from '$lib/client';
	import { Mic, MicOff } from 'lucide-svelte';
	import { Button, buttonVariants } from './ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	
	let picture;

	const onFileChange = (e) => {
		let image = e.target.files.[0];
		let reader = new FileReader();
		reader.readAsDataURL(image);
		reader.onload = e => {
            avatar = e.target.result
    };
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
			<Input id="picture" type="file" on:change={(e) => onFileChange(e)} />
			<img id="preview" src={picture} />
		</div>
	</Dialog.Content>
</Dialog.Root>
