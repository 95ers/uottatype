<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { diffChars } from 'diff';
	import type { Updates } from '$lib';
	import { Button } from './ui/button';
	import { Input } from './ui/input';
	import { Label } from './ui/label';
	import { untrack } from 'svelte';
	import type { Document } from '$lib/server/db/schema';
	import {
		AArrowDown,
		AArrowUp,
		AlignCenter,
		AlignLeft,
		AlignRight,
		Bold,
		Italic,
		Link,
		Underline,
		UserPlus
	} from 'lucide-svelte';
	import Recorder from './recorder.svelte';

	let {
		onContentUpdate,
		onTitleUpdate,
		onUserAdd,
		document: doc,
		userId
	}: {
		onContentUpdate: (updates: Updates) => void;
		onTitleUpdate: (title: string) => void;
		onUserAdd: (username: string) => void;
		document: Document;
		userId: string;
	} = $props();

	let title = $state(doc.title);
	let editorContent = $state(doc.content);
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

	function getComputedStyleProperty(el: Node | ParentNode, propName: string) {
		if (window.getComputedStyle) {
			return window.getComputedStyle(el, null)[propName];
		} else if (el.currentStyle) {
			return el.currentStyle[propName];
		}
	}

	export function setTitle(t: string) {
		title = t;
	}

	function reportColourAndFontSize() {
		let containerEl: Node | ParentNode | null;
		let sel: Selection | null;
		if (window.getSelection) {
			sel = window.getSelection();
			if (sel?.rangeCount) {
				containerEl = sel.getRangeAt(0).commonAncestorContainer;
				// Make sure we have an element rather than a text node
				if (containerEl.nodeType == 3) {
					containerEl = containerEl.parentNode;
				}
			}
		} else if ((sel = document.selection) && sel.type != 'Control') {
			containerEl = sel.createRange().parentElement();
		}

		if (containerEl) {
			var fontSize = getComputedStyleProperty(containerEl, 'fontSize');
			var colour = getComputedStyleProperty(containerEl, 'color');

			return fontSize;
		}
	}

	/**
	 * Executes a command on the editor.
	 * @param {string} command - The command to execute.
	 * @param {string | null} value - Optional value for the command.
	 */
	const executeCommand = (command: string, value?: string) => {
		if (command === 'fontSize') {
			const fontSize = document.queryCommandValue('FontSize');

			if (fontSize) {
				const currentFontSize = parseInt(fontSize);

				if (value === '1') {
					value = (currentFontSize + 1).toString();
				} else if (value === '-1') {
					value = (currentFontSize - 1).toString();
				}
			} else {
				value = '3';
			}
		}

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
		lastInputInterval = setTimeout(captureUpdate, 50);
	};

	let lastTitleInterval: number;

	$effect(() => {
		clearInterval(lastTitleInterval);
		lastTitleInterval = setTimeout(() => {
			onTitleUpdate(title);
		}, 200);
	});

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

<div class="flex w-full flex-col items-center bg-gray-50">
	<div class="mx-16 mt-8 flex w-full max-w-5xl p-1">
		<Input class="border-none bg-gray-50 text-2xl" bind:value={title} />
	</div>
	<div class="mx-16 my-6 flex w-full max-w-5xl gap-2 p-1">
		<Button variant="secondary" onclick={() => executeCommand('bold')}>
			<Bold size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('italic')}>
			<Italic size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('underline')}>
			<Underline size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('justifyRight')}>
			<AlignRight size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('justifyCenter')}>
			<AlignCenter size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('justifyLeft')}>
			<AlignLeft size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('createLink', prompt('Enter URL'))}>
			<Link size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('fontSize', '1')}>
			<AArrowUp size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('fontSize', '-1')}>
			<AArrowDown size="24" />
		</Button>

		<div class="ml-auto"></div>

		<Recorder id={doc.id} {userId} />

		<Button
			onclick={() => {
				addUserOpen = true;
			}}
		>
			<UserPlus size="24" />
		</Button>
	</div>

	<!-- Editable Content Area -->
	<div
		bind:this={editorElement}
		contenteditable="true"
		class="mx-16 h-screen min-h-[150px] w-full max-w-5xl rounded border bg-white p-4 focus:outline-none"
		bind:innerHTML={editorContent}
		oninput={onInput}
		spellcheck="false"
	></div>
</div>
