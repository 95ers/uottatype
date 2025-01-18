<script module lang="ts">
	export type Action = {
		type: 'insert' | 'delete';
		content: string;
		position: number;
	};
</script>

<script lang="ts">
	let {
		onContentUpdate
	}: {
		onContentUpdate: (action: Action) => void;
	} = $props();

	let editorContent = $state('<p>Edit this text...</p>');
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
		const selection = window.getSelection();
		const contentText = getTextContent();
		const action = {
			type: 'insert', // Default action type
			content: '',
			position: 0
		};

		if (selection?.rangeCount > 0) {
			const range = selection.getRangeAt(0);
			action.position = calculateTextOffset(range);
			action.content = range.toString();

			// Detect deletion or addition
			if (editorContent !== editorElement.innerHTML) {
				const newContent = editorElement.innerHTML;
				const oldContent = editorContent;

				if (newContent.length < oldContent.length) {
					action.type = 'delete';
					action.content = oldContent.slice(
						action.position,
						action.position + (oldContent.length - newContent.length)
					);
				} else {
					action.type = 'insert';
					action.content = newContent.slice(
						action.position,
						action.position + (newContent.length - oldContent.length)
					);
				}
			}

			// Update internal content and dispatch event
			editorContent = editorElement.innerHTML;
			onContentUpdate(action);
		}
	};

	/**
	 * Calculates the offset of the current selection relative to the start of the editor content.
	 * @param {Range} range - The current selection range.
	 * @returns {number} The offset in plain text.
	 */
	const calculateTextOffset = (range) => {
		const preRange = document.createRange();
		preRange.selectNodeContents(editorElement);
		preRange.setEnd(range.startContainer, range.startOffset);
		return preRange.toString().length;
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
