<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import { diffChars } from 'diff';
	import type { Updates } from '$lib';
	import { Button } from './ui/button';
	import { Input } from './ui/input';
	import { Label } from './ui/label';
	import { onMount, untrack } from 'svelte';
	import type { Document, User } from '$lib/server/db/schema';
	import {
		AArrowDown,
		AArrowUp,
		AlignCenter,
		AlignLeft,
		AlignRight,
		Bold,
		ImagePlus,
		Italic,
		Link,
		Underline,
		UserPlus
	} from 'lucide-svelte';
	import Recorder from './recorder.svelte';
	import ImageCapture from './image-capture.svelte';
	import Proximity from './proximity.svelte';

	let {
		onContentUpdate,
		onTitleUpdate,
		onUserAdd,
		onGenerateAltText,
		onGenerateImageText,
		onCursorMoved,
		document: doc,
		user
	}: {
		onContentUpdate: (updates: Updates) => void;
		onTitleUpdate: (title: string) => void;
		onUserAdd: (username: string) => void;
		onGenerateAltText: (image: HTMLImageElement) => Promise<string>;
		onGenerateImageText: (src: string) => Promise<string>;
		onCursorMoved: (x: number, y: number) => void;
		document: Document;
		user: User;
	} = $props();

	let proxmity: Proximity;

	let title = $state(doc.title);
	let editorContent = $state(doc.content);
	let previousContent = untrack(() => editorContent);
	let editorElement: HTMLDivElement;
	let editorWrapper: HTMLDivElement;

	let currentLine = $state(0);

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

	$effect(() => {
		proxmity.setLine(currentLine);
	});

	export function setTitle(t: string) {
		title = t;
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

	function onClick(event: MouseEvent) {
		event.preventDefault();
		editorElement.focus();

		const line = getCurrentLineNumber();

		currentLine = line;

		if (event.target.nodeName === 'IMG') {
			imageActionsOpen = true;
			selectedImage = event.target as HTMLImageElement;
		} else {
			imageActionsOpen = false;
			selectedImage = null;
		}
	}

	// ... ???
	function getCurrentLineNumber() {
		const lineHeight = parseFloat(window.getComputedStyle(editorElement).lineHeight.slice(0, -2));
		const save = window.getSelection();
		const s = window.getSelection();

		if (!save || !s) return -1;

		s.modify('extend', 'forward', 'character');
		const range = s.getRangeAt(0);
		let p = range.getClientRects();
		let top;
		if (typeof p[1] != 'undefined') {
			top = p[1].top + window.scrollY;
		} else if (typeof p[0] != 'undefined') {
			top = p[0].top + window.scrollY;
		} else {
			const canvas = document.createElement('canvas');
			canvas.setAttribute('id', 'tempCaretFinder');
			range.insertNode(canvas);
			const p = document.querySelector('canvas#tempCaretFinder')!.getBoundingClientRect();
			document.querySelector('canvas#tempCaretFinder')?.remove();
			top = p.top;
		}

		if (range.endOffset === range.startOffset + 1) save.modify('move', 'backward', 'character');

		return Math.ceil((top - editorElement.getBoundingClientRect().top) / lineHeight) - 5;
	}

	onMount(() => {
		proxmity.setLine(currentLine);
	});

	let imageActionsOpen = $state(false);
	let selectedImage: HTMLImageElement | null;

	function stringToColor(inputString: string) {
		let hash = 0;
		for (let i = 0; i < inputString.length; i++) {
			hash = inputString.charCodeAt(i) + ((hash << 5) - hash);
		}

		const r = (hash >> 0) & 0xff;
		const g = (hash >> 8) & 0xff;
		const b = (hash >> 16) & 0xff;

		return `rgb(${r}, ${g}, ${b})`;
	}

	// x and y are normalized to the document width and height [0, 1]
	export function onCursorMove(userId: string, x: number, y: number) {
		let cursor = cursors.get(userId);

		if (!cursor) {
			cursor = document.createElement('div');
			cursor.style.position = 'absolute';
			cursor.style.width = '4px';
			cursor.style.height = '25px';
			cursor.style.backgroundColor = stringToColor(userId);
			cursor.style.zIndex = '1000';
			cursor.style.pointerEvents = 'none';
			cursor.style.transition = 'transform 0.1s';
			editorWrapper.appendChild(cursor);
			cursors.set(userId, cursor);
		}

		console.log(cursor);

		cursor.style.top = `${y * 100}%`;
		cursor.style.left = `${x * 100}%`;
	}

	const cursors = new Map<string, HTMLDivElement>();

	let moveTimeout: number;

	// get x and y within the `editorElement` from 0 to 1
	function onMouseMove(event: MouseEvent) {
		const x = event.offsetX / editorElement.clientWidth;
		const y = event.offsetY / editorElement.clientHeight;

		onCursorMoved(x, y);
	}
</script>

<Dialog.Root open={addUserOpen} onOpenChange={(o) => (addUserOpen = o)}>
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
					addUserUsername = '';
					addUserOpen = false;
				}}
				disabled={addUserUsername.length === 0}>Add user</Button
			>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<Sheet.Root open={imageActionsOpen} onOpenChange={(o) => (imageActionsOpen = o)}>
	<Sheet.Content side="left">
		<Sheet.Header>
			<Sheet.Title>Image actions</Sheet.Title>
			<Sheet.Description>Caption, alt text, and more.</Sheet.Description>
		</Sheet.Header>
		<Sheet.Footer>
			<Button
				type="submit"
				onclick={async () => {
					const alt = await onGenerateAltText(selectedImage!);

					document.execCommand('insertText', false, alt);
				}}>Generate caption</Button
			>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>

<div class="flex w-full flex-col items-center bg-gray-50 p-8">
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

		<Button
			variant="secondary"
			onclick={() => {
				const url = prompt('Enter URL');
				if (url) executeCommand('createLink', url);
			}}
		>
			<Link size="24" />
		</Button>

		<Button
			variant="secondary"
			onclick={() => {
				const url = prompt('Enter image URL');
				if (url) executeCommand('insertImage', url);
			}}
		>
			<ImagePlus size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('fontSize', '1')}>
			<AArrowUp size="24" />
		</Button>

		<Button variant="secondary" onclick={() => executeCommand('fontSize', '-1')}>
			<AArrowDown size="24" />
		</Button>

		<div class="ml-auto"></div>

		<ImageCapture
			onSubmit={async (src: string) => {
				const text = await onGenerateImageText(src);

				editorElement.focus();
				document.execCommand('insertText', false, text);
			}}
		></ImageCapture>

		<Recorder id={doc.id} userId={user.id} />

		<Button
			onclick={() => {
				addUserOpen = true;
			}}
		>
			<UserPlus size="24" />
		</Button>
	</div>

	<div class="relative mx-16 w-full max-w-5xl" bind:this={editorWrapper} onmousemove={onMouseMove}>
		<div
			bind:this={editorElement}
			contenteditable="true"
			class="h-full min-h-screen w-full break-words rounded border bg-white p-24 opacity-100 focus:outline-none"
			bind:innerHTML={editorContent}
			oninput={onInput}
			spellcheck="false"
			onclick={onClick}
			onkeydown={(e) => {
				if (
					e.key === 'Enter' ||
					e.key === 'ArrowDown' ||
					e.key === 'ArrowUp' ||
					e.key === 'ArrowLeft' ||
					e.key === 'ArrowRight'
				) {
					currentLine = getCurrentLineNumber();
				}
			}}
		></div>
	</div>

	<Proximity documentId={doc.id} {user} initialLine={0} bind:this={proxmity} />
</div>
