<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { diffChars } from 'diff';
	import type { Updates } from '$lib';
	import { Button } from './ui/button';
	import { Input } from './ui/input';
	import { Label } from './ui/label';
	import { untrack } from 'svelte';
	import { Link } from 'lucide-svelte';

	let {
		onContentUpdate,
		onUserAdd,
		initialContent = 'Edit this text...'
	}: {
		onContentUpdate: (updates: Updates) => void;
		onUserAdd: (username: string) => void;
		initialContent: string;
	} = $props();

	let editorContent = $state(initialContent);
	let previousContent = untrack(() => editorContent);
	let editorElement: HTMLDivElement;

	export function applyUpdates(updates: Updates) {
		for (const update of updates) {
			if (update.type === 'insert') {
				editorContent =
					editorContent.slice(0, update.index) + update.text + editorContent.slice(update.index);
			} else if (update.type === 'delete') {
				editorContent =
					editorContent.slice(0, update.index) + editorContent.slice(update.index + update.offset);
			}
		}

		previousContent = editorContent;
	}

	/**
	 * Executes a command on the editor.
	 * @param {string} command - The command to execute.
	 * @param {string | null} value - Optional value for the command.
	 */
	const executeCommand = (command: string, value?: string) => {
		document.execCommand(command, false, value);
		captureUpdate();
	};

	const captureUpdate = () => {
		const changes = diffChars(previousContent, editorContent);
		// when adding new text, we send the index to insert the text inside
		// when deleting text, we send the index and the amount to delete

		const updates: Updates = [];
		let index = 0;

		for (const change of changes) {
			if (change.added) {
				updates.push({
					type: 'insert',
					index,
					text: change.value
				});

				index += change.count!;
			} else if (change.removed) {
				updates.push({
					type: 'delete',
					index,
					offset: change.count!
				});
			} else {
				index += change.count!;
			}
		}

		onContentUpdate(updates);
		previousContent = editorContent;
	};

	let lastInputInterval: number;

	const onInput = () => {
		clearInterval(lastInputInterval);
		lastInputInterval = setTimeout(captureUpdate, 100);
	};

	let addUserOpen = $state(false);
	let addUserUsername = $state('');
</script>

<Dialog.Root open={addUserOpen}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Add user to document</Dialog.Title>
			<Dialog.Description>Enter the user you want to add to this document.</Dialog.Description>
		</Dialog.Header>
		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="name" class="text-right">Username</Label>
				<Input id="name" bind:value={addUserUsername} class="col-span-3" />
			</div>
		</div>
		<Dialog.Footer>
			<Button
				type="submit"
				onclick={() => {
					onUserAdd(addUserUsername);
					addUserOpen = false;
				}}
				disabled={addUserUsername.length === 0}>Add user</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<div>
	<div class="mb-4 flex gap-2 p-1">
		<button
			type="button"
			onclick={() => executeCommand('bold')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			<b>B</b>
		</button>
		<button
			type="button"
			onclick={() => executeCommand('italic')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			<i>I</i>
		</button>
		<button
			type="button"
			onclick={() => executeCommand('underline')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			<u>U</u>
		</button>
		<button
			type="button"
			onclick={() => executeCommand('insertOrderedList')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			OL
		</button>
		<button
			type="button"
			onclick={() => executeCommand('insertUnorderedList')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			UL
		</button>
		<button
			type="button"
			onclick={() => executeCommand('createLink', prompt('Enter URL'))}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
		</button>

		<Button
			class="ml-auto"
			onclick={() => {
				addUserOpen = true;
			}}>Add user</Button
		>
	</div>

	<!-- Editable Content Area -->
	<div
		bind:this={editorElement}
		contenteditable="true"
		class="min-h-[150px] rounded border bg-white p-4 focus:outline-none"
		bind:innerHTML={editorContent}
		oninput={onInput}
	></div>
</div>
