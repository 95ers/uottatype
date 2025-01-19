import EventEmitter from 'eventemitter3';
import solace from 'solclientjs';

const factory = new solace.SolclientFactoryProperties();
factory.profile = solace.SolclientFactoryProfiles.version10_5;

solace.SolclientFactory.init(factory);

export class Client extends EventEmitter {
	protected solace: typeof solace;
	protected session!: solace.Session;

	protected ready: Promise<void>;

	constructor(options: solace.SessionProperties) {
		super();

		this.solace = solace;
		this.ready = this.connect(options);
	}

	protected async waitForEvent(ok: solace.SessionEventCode, err: solace.SessionEventCode) {
		return new Promise<void>((resolve, reject) => {
			this.session.on(ok, resolve);
			this.session.on(err, reject);
		});
	}

	public async connect(options: solace.SessionProperties) {
		this.session = solace.SolclientFactory.createSession(options);

		this.session.connect();

		await this.waitForEvent(
			solace.SessionEventCode.UP_NOTICE,
			solace.SessionEventCode.CONNECT_FAILED_ERROR
		);

		console.log('up!');

		this.session.on(solace.SessionEventCode.MESSAGE, (message) => {
			const destination = message.getDestination();

			if (destination) {
				const name = destination.getName();

				this.emit(name, message, name);

				// emit with wildcard in each topic path part
				const parts = name.split('/');

				for (let i = 0; i < parts.length; i++) {
					for (let j = i; j < parts.length; j++) {
						const path = parts.map((_, k) => (k === i || k === j ? '*' : parts[k])).join('/');

						this.emit(path, message, name);
					}
				}
			}
		});
	}

	public async disconnect() {
		this.session.disconnect();

		return new Promise<void>((resolve) => {
			this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
				this.session.dispose();
				resolve();
			});
		});
	}

	private async startSubscription(topic: string) {
		if (this.listenerCount(topic) > 1) {
			return;
		}

		await this.ready;

		this.session.subscribe(
			solace.SolclientFactory.createTopicDestination(topic),
			true,
			topic,
			10_000
		);

		return this.waitForEvent(
			solace.SessionEventCode.SUBSCRIPTION_OK,
			solace.SessionEventCode.SUBSCRIPTION_ERROR
		);
	}

	private async stopSubscription(topic: string) {
		await this.ready;

		this.session.unsubscribe(
			solace.SolclientFactory.createTopicDestination(topic),
			true,
			topic,
			10_000
		);

		return this.waitForEvent(
			solace.SessionEventCode.SUBSCRIPTION_OK,
			solace.SessionEventCode.SUBSCRIPTION_ERROR
		);
	}

	public subscribeJson(topic: string, fn: (message: object, topic: string) => void) {
		return this.subscribe(topic, (message, topic) =>
			fn(JSON.parse(message.getBinaryAttachment() as string), topic)
		);
	}

	public subscribe(topic: string, fn: (message: solace.Message, topic: string) => void) {
		super.on(topic, fn);
		this.startSubscription(topic);
		return fn;
	}

	public unsubscribe(topic: string, fn: (message: solace.Message, topic: string) => void) {
		super.off(topic, fn);

		if (this.listenerCount(topic) === 0) {
			this.stopSubscription(topic);
		}
	}

	public unsubscribeJson(topic: string, fn: (message: object, topic: string) => void) {
		return this.unsubscribe(topic, fn);
	}

	public async publish(
		topic: string,
		content: string | Uint8Array | ArrayBufferLike,
		userId?: string
	) {
		await this.ready;

		const message = solace.SolclientFactory.createMessage();

		message.setDestination(solace.SolclientFactory.createTopicDestination(topic));

		if (userId) {
			message.setUserData(userId);
		}

		message.setBinaryAttachment(content);
		message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);

		try {
			this.session.send(message);
		} catch (e) {
			console.error(e);
		}
	}

	public async publishJson(topic: string, content: object) {
		await this.publish(topic, JSON.stringify(content));
	}
}
