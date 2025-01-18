export type Authenticated<T> = {
	userId: string;
	action: T;
};

export type Addition = {
	type: 'insert';
	index: number;
	text: string;
};

export type Deletion = {
	type: 'delete';
	index: number;
	offset: number;
};

export type Updates = (Addition | Deletion)[];
