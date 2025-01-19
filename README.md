# uOttaType

uOttaType is an AI powered real-time collaborative document editor. It allows users to create documents that can be shared with collaborators, and worked on in real-time, with quality of life features such as, voice chatting and many AI generation techniques. uOttaType serves to enhance document editing by providing a centralized application with all the tools you need to accelerate your writing experience.

## Frameworks and Tools used
The uOttaType website was created using SvelteKit and TypeScript. Our backend server used Lucia auth for authentication and Drizzle as an ORM. This backend server communicated in real-time to users using the Solace PubSub+ event broker. Our website contains a plethora of AI tools available for use. For these AI tools we incorporated Grok and OLlama and used the BGE-m3, Open-AI whisper, and Llama 3 models.
