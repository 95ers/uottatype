<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();
</script>

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow-sm">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center">
				<img
					src="https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png"
					alt="Google Docs"
					class="mr-2 h-8 w-8"
				/>
				<h1 class="text-xl font-semibold text-gray-800">UOtta9to5</h1>
			</div>
			<div class="flex items-center space-x-4">
				<div class="relative">
					<Input type="text" placeholder="Search" class="w-64 py-2  " />
				</div>
				<Button>Logout</Button>
				<Avatar>
					<AvatarImage src="https://github.com/vasiltop.png" alt="User" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-2xl font-semibold text-gray-800">My Documents</h2>
			<form method="POST" action="?/createDocument">
				<Button type="submit" variant="default" class="flex items-center">New Document</Button>
			</form>
		</div>

		<div class="grid grid-cols-1 gap-6 pt-16 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each data.myDocs as doc}
				<a href={`/document/${doc.id}`}>
					<div
						class="rounded-lg bg-white p-4 shadow-md transition-shadow duration-200 hover:shadow-lg"
					>
						<h3 class="mb-1 text-lg font-medium text-gray-800">{doc.title}</h3>
						<p class="text-sm text-gray-500">Created At: {doc.createdAt}</p>
					</div>
				</a>
			{/each}
		</div>

		<div class="mb-6 flex items-center justify-between pt-16">
			<h2 class="text-2xl font-semibold text-gray-800">Shared with me</h2>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each data.sharedDocs as doc}
				<a href={`/document/${doc.id}`}>
					<div
						class="rounded-lg bg-white p-4 shadow-md transition-shadow duration-200 hover:shadow-lg"
					>
						<h3 class="mb-1 text-lg font-medium text-gray-800">{doc.title}</h3>
						<p class="text-sm text-gray-500">Created At: {doc.createdAt}</p>
					</div>
				</a>
			{/each}
		</div>
	</main>
</div>
