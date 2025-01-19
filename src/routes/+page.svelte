<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import type { PageServerData } from './$types';
	import { enhance } from '$app/forms';

	let { data }: { data: PageServerData } = $props();

	let searchQuery: string = $state('');
</script>

<div class="min-h-screen bg-gray-100">
	<header class="bg-white shadow-sm">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-center gap-2">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-text"
					><path d="M17 6.1H3" /><path d="M21 12.1H3" /><path d="M15.1 18H3" /></svg
				>
				<h1 class="text-xl font-semibold text-gray-800">uOtta9to5</h1>
			</div>
			<div class="flex items-center space-x-4">
				<div class="relative">
					<Input type="text" placeholder="Search" class="w-64 py-2" bind:value={searchQuery} />
				</div>
				<form method="post" action="?/logout" use:enhance>
					<Button type="submit">Sign out</Button>
				</form>
				<Avatar>
					<AvatarImage
						src="https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg"
						alt="User"
					/>
					<AvatarFallback>CN</AvatarFallback>
				</Avatar>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-2xl font-semibold text-gray-800">My Documents</h2>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			<form method="POST" action="?/createDocument">
				<Button
					type="submit"
					variant="ghost"
					class="h-full w-full max-w-64 rounded-none bg-white text-5xl hover:bg-gray-50">+</Button
				>
			</form>
			{#if !data.myDocs.length}
				<p class="text-gray-800">You have not created any documents.</p>
			{/if}

			{#each data.myDocs.filter((doc) => doc.title
					.toLowerCase()
					.includes(searchQuery.toLowerCase())) as doc}
				{@render document(doc)}
			{/each}
		</div>

		<div class="mb-6 flex items-center justify-between pt-16">
			<h2 class="text-2xl font-semibold text-gray-800">Shared with me</h2>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
			{#if !data.sharedDocs.length}
				<p class="text-gray-800">You have not been invited to any documents.</p>
			{/if}
			{#each data.sharedDocs.filter((doc) => doc.title
					.toLowerCase()
					.includes(searchQuery.toLowerCase())) as doc}
				{@render document(doc)}
			{/each}
		</div>
	</main>
</div>

{#snippet document(doc: any)}
	<a href={`/document/${doc.id}`}>
		<div class="max-w-64 bg-white shadow-md transition-shadow duration-200 hover:shadow-lg">
			<p class=" border-b p-4 text-[0.3rem] leading-3">
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
				labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
				laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
				voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
				cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. <br
				/>

				Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
				laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
				architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit
				aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
				voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet,
				consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et
				dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum
				exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi
				consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil
				molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? <br />

				At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
				voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati
				cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id
				est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam
				libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod
				maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
				Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut
				et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a
				sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis
				doloribus asperiores repellat. <br />
			</p>
			<div class="p-4">
				<h3 class="mx-2 text-lg font-medium">{doc.title}</h3>
				<div class="flex items-center p-1">
					<img
						src="https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png"
						alt="Google Docs"
						class="h-8 w-8"
					/>
					<p class="text-sm text-gray-500">Created: {doc.createdAt.toDateString()}</p>
				</div>
			</div>
		</div>
	</a>
{/snippet}
