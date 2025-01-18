import EventEmitter from 'eventemitter3';
import solace from 'solclientjs';

const factory = new solace.SolclientFactoryProperties();
factory.profile = solace.SolclientFactoryProfiles.version10;

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

		this.session.on(solace.SessionEventCode.MESSAGE, (message) => {
			const destination = message.getDestination();

			if (destination) {
				this.emit(destination.getName(), JSON.parse(message.getBinaryAttachment() as string));
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

	public async subscribe(topic: string, fn: (message: object) => void) {
		super.on(topic, fn);

		return this.startSubscription(topic);
	}

	public async unsubscribe(topic: string, fn: (message: object) => void) {
		super.off(topic, fn);

		if (this.listenerCount(topic) === 0) {
			await this.stopSubscription(topic);
		}
	}

	public async publish(topic: string, content: object) {
		await this.ready;

		const message = solace.SolclientFactory.createMessage();

		message.setDestination(solace.SolclientFactory.createTopicDestination(topic));
		message.setBinaryAttachment(JSON.stringify(content));
		message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);

		this.session.send(message);
	}
}
