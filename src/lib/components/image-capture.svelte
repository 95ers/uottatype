
<script lang="ts">
    import { solace } from '$lib/client';
    import { Mic, MicOff } from 'lucide-svelte';
    import { Button, buttonVariants } from './ui/button';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';

    let input;
    let image: HTMLImageElement | null = null;
    let shown: boolean = false;

    function onUpload() {
        const file = input?.files[0];
        console.log(input.files.length);
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                if (image) {
                    image.src = reader.result as string;
                }
            });
            shown = true;
            reader.readAsDataURL(file);
        } else {
            console.error("Please upload a valid image file.");
        }
    }
>>>>>>> 38c66de (feat: add file upload logic)
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
            <Input id="picture" type="file" bind:this={input} on:change={() => onUpload()} />
            {#if shown}
            <img id="preview" bind:this={image} alt="Preview" />
            {/if}
        </div>
    </Dialog.Content>
</Dialog.Root>
