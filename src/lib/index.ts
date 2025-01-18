export type Authenticated<T> = {
	userId: string;
	action: T;
};

export type Addition = {
	index: number;
	text: string;
};

export type Deletion = {
	index: number;
	offset: number;
};

export type Updates = (Addition | Deletion)[];
