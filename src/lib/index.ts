export type Action = {
	type: 'insert' | 'delete';
	content: string;
	position: number;
};

export type WrappedAction = {
	userId: string;
	action: Action;
};
