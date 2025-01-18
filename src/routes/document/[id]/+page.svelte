<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Bold,
		Italic,
		Underline,
		AlignLeft,
		AlignCenter,
		AlignRight,
		List,
		ListOrdered
	} from 'lucide-svelte';

	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
	import { client } from '$lib/solace';
	import { onDestroy } from 'svelte';
	import type solace from 'solclientjs';

	const topic = `/95ers/document/${data.doc.id}/update`;

	let editor: HTMLDivElement;
	let documentTitle = $state('Untitled Document');

	function formatDoc(command: string, value?: string) {
		document.execCommand(command, false, value);
		editor.focus();
	}

	$effect(() => {
		editor.contentEditable = 'true';
		client.subscribe(topic, onUpdate);
	});

	onDestroy(() => {
		client.unsubscribe(topic, onUpdate);
	});

	async function onUpdate(message: solace.Message) {}
</script>

<div class="flex h-screen flex-col bg-background text-foreground">
	<header class="flex items-center justify-between border-b p-4">
		<div class="flex items-center space-x-4">
			<img src="/docs-logo.png" alt="Google Docs Clone" class="h-10 w-10" />
			<div class="flex flex-col">
				<Input
					type="text"
					bind:value={documentTitle}
					class="border-none bg-transparent text-xl font-semibold focus:ring-0"
				/>
				<div class="flex space-x-2 text-sm text-muted-foreground">
					<button class="rounded px-2 py-1 hover:bg-muted">File</button>
					<button class="rounded px-2 py-1 hover:bg-muted">Edit</button>
					<button class="rounded px-2 py-1 hover:bg-muted">View</button>
					<button class="rounded px-2 py-1 hover:bg-muted">Insert</button>
					<button class="rounded px-2 py-1 hover:bg-muted">Format</button>
					<button class="rounded px-2 py-1 hover:bg-muted">Tools</button>
				</div>
			</div>
		</div>
		<Button variant="outline">Share</Button>
	</header>

	<div class="flex-1 overflow-auto">
		<div class="mx-auto my-8 max-w-4xl">
			<div class="rounded-lg bg-card shadow-lg">
				<div class="flex items-center space-x-1 border-b p-2">
					<Button variant="ghost" size="icon" on:click={() => formatDoc('bold')}>
						<Bold class="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" on:click={() => formatDoc('italic')}>
						<Italic class="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" on:click={() => formatDoc('underline')}>
						<Underline class="h-4 w-4" />
					</Button>
					<Separator orientation="vertical" class="h-6" />
					<Button variant="ghost" size="icon" on:click={() => formatDoc('justifyLeft')}>
						<AlignLeft class="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" on:click={() => formatDoc('justifyCenter')}>
						<AlignCenter class="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" on:click={() => formatDoc('justifyRight')}>
						<AlignRight class="h-4 w-4" />
					</Button>
					<Separator orientation="vertical" class="h-6" />
					<Button variant="ghost" size="icon" on:click={() => formatDoc('insertUnorderedList')}>
						<List class="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" on:click={() => formatDoc('insertOrderedList')}>
						<ListOrdered class="h-4 w-4" />
					</Button>
				</div>
				<div
					bind:this={editor}
					class="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto min-h-[calc(100vh-12rem)] p-8 focus:outline-none"
				>
					<p>Start typing your document here...</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(html, body) {
		height: 100%;
		margin: 0;
		padding: 0;
	}
</style>
