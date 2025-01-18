<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';

	let documents = [
		{ id: 1, title: 'Untitled Document', lastModified: 'Apr 22, 2023' },
		{ id: 2, title: 'Project Proposal', lastModified: 'May 15, 2023' },
		{ id: 3, title: 'Meeting Notes', lastModified: 'Jun 3, 2023' },
		{ id: 4, title: 'Budget Report', lastModified: 'Jun 10, 2023' },
		{ id: 5, title: 'Marketing Plan', lastModified: 'Jun 18, 2023' }
	];
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
				<Button>Login</Button>
				<Avatar>
					<AvatarImage src="https://github.com/shadcn.png" alt="User" />
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-2xl font-semibold text-gray-800">My Documents</h2>
			<Button variant="default" class="flex items-center">New Document</Button>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#each documents as doc}
				<div
					class="rounded-lg bg-white p-4 shadow-md transition-shadow duration-200 hover:shadow-lg"
				>
					<h3 class="mb-1 text-lg font-medium text-gray-800">{doc.title}</h3>
					<p class="text-sm text-gray-500">Last modified: {doc.lastModified}</p>
				</div>
			{/each}
		</div>
	</main>
</div>
