<script module lang="ts">
	type Addition = {
		index: number;
		text: string;
	};

	type Deletion = {
		index: number;
		offset: number;
	};

	type Updates = Array<Addition | Deletion>;
</script>

<script lang="ts">
	import { diffChars } from 'diff';
	let {
		onContentUpdate
	}: {
		onContentUpdate: (updates: Updates) => void;
	} = $props();

	let editorContent = $state('Edit this text...');
	let previousContent = editorContent;
	let editorElement: HTMLDivElement;

	/**
	 * Executes a command on the editor.
	 * @param {string} command - The command to execute.
	 * @param {string | null} value - Optional value for the command.
	 */
	const executeCommand = (command: string, value?: string) => {
		document.execCommand(command, false, value);
		captureUpdate();
	};

	/**
	 * Sets a specific subslice of the content programmatically.
	 * @param {string} newContent - The new content to set.
	 * @param {number} start - The starting index of the subslice.
	 * @param {number} end - The ending index of the subslice.
	 */
	export function setSubsliceContent(newContent: string, start: number, end: number) {
		const contentText = getTextContent();
		const updatedContent = contentText.slice(0, start) + newContent + contentText.slice(end);
		setEditorContent(updatedContent);
	}

	const getTextContent = () => editorElement?.innerText || '';

	/**
	 * Sets the entire editor content programmatically.
	 * @param {string} content - The new content to set.
	 */
	export function setEditorContent(content: string) {
		editorContent = content;
		if (editorElement) {
			editorElement.innerHTML = editorContent;
		}
	}

	const captureUpdate = () => {
		console.log(editorContent);

		let changes = diffChars(previousContent, editorContent);
		console.log(changes);
		// when adding new text, we send the index to insert the text inside
		// when deleting text, we send the index and the amount to delete

		let updates: Updates = [];
		let index = 0;
		for (const change of changes) {
			if (change.added) {
				updates.push({
					index,
					text: change.value
				});
			} else if (change.removed) {
				updates.push({
					index,
					offset: change.count!
				});
			}

			index += change.count!;
		}

		onContentUpdate(updates);
		previousContent = editorContent;
	};

	/**
	 * Handles user input events and captures updates.
	 */
	const onInput = () => captureUpdate();
</script>

<div>
	<!-- Toolbar -->
	<div class="mb-4 flex gap-2">
		<button
			type="button"
			on:click={() => executeCommand('bold')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			<b>B</b>
		</button>
		<button
			type="button"
			on:click={() => executeCommand('italic')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			<i>I</i>
		</button>
		<button
			type="button"
			on:click={() => executeCommand('underline')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			<u>U</u>
		</button>
		<button
			type="button"
			on:click={() => executeCommand('insertOrderedList')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			OL
		</button>
		<button
			type="button"
			on:click={() => executeCommand('insertUnorderedList')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			UL
		</button>
		<button
			type="button"
			on:click={() => executeCommand('createLink', prompt('Enter URL'))}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			Link
		</button>
		<button
			type="button"
			on:click={() => executeCommand('removeFormat')}
			class="rounded border bg-gray-100 px-3 py-1 hover:bg-gray-200"
		>
			Clear
		</button>
	</div>

	<!-- Editable Content Area -->
	<div
		bind:this={editorElement}
		contenteditable="true"
		class="min-h-[150px] rounded border bg-white p-4 focus:outline-none"
		bind:innerHTML={editorContent}
		on:input={onInput}
	></div>
</div>
